"""
Envio de recibo de doação por e-mail via Resend.
Usado para doações NÃO anônimas (com nome e e-mail do doador).
"""
import os
from html import escape

import resend

CAMPAIGN_NAME = "Teleton 2026"
LOGO_URL = "https://aacd.vtexassets.com/assets/vtex/assets-builder/aacd.store/0.0.49/logo-aacd___07c4f535c1d9859db0b880c512993be9.png"


def _format_brl(value: float) -> str:
    return "R$ " + f"{float(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _build_html(donor_name: str, value: float, donate_url: str, heading: str = "Recibo da sua doação", intro: str = None) -> str:
    name = escape(donor_name or "Doador(a)")
    valor = escape(_format_brl(value))
    url = escape(donate_url, quote=True)
    campaign = escape(CAMPAIGN_NAME)
    if intro is None:
        intro = f"Olá <b>{name}</b>, obrigado por apoiar a campanha <b>{campaign}</b>! Aqui estão os detalhes da sua doação:"
    return f"""<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#323232">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:linear-gradient(to right,#ffffff 0%,#ffffff 30%,#d9efef 100%);padding:20px 24px;border-radius:14px 14px 0 0;border:1px solid #eee;border-bottom:none">
      <img src="{LOGO_URL}" alt="AACD - vida é movimento" width="150" style="display:block;height:auto" />
    </div>
    <div style="background:#ffffff;padding:28px 24px;border:1px solid #eee;border-top:none">
      <h1 style="font-size:22px;margin:0 0 6px;color:#323232">{escape(heading)}</h1>
      <div style="height:4px;width:60px;background:#eb1941;border-radius:999px;margin:0 0 20px"></div>
      <p style="font-size:15px;line-height:1.5;margin:0 0 18px">{intro}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;font-size:14px">Doador(a)</td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;font-size:14px">{name}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;color:#666;font-size:14px">Campanha</td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;font-size:14px">{campaign}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#666;font-size:14px">Valor da doação</td>
          <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:18px;color:#eb1941">{valor}</td>
        </tr>
      </table>
      <div style="text-align:center;margin:0 0 20px">
        <a href="{url}" style="background:#eb1941;color:#ffffff;padding:16px 42px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;font-size:16px;letter-spacing:1px;text-transform:uppercase">Doar</a>
      </div>
      <p style="font-size:13px;line-height:1.5;color:#888;margin:0">Clique no botão <b>Doar</b> para concluir sua contribuição via PIX (QR Code e copia-e-cola) com o valor já preenchido.</p>
    </div>
    <div style="padding:18px 24px;text-align:center;color:#999;font-size:12px">
      Sua doação ajuda a AACD a oferecer reabilitação para pacientes com deficiência.
    </div>
  </div>
</body></html>"""


async def send_donation_receipt(donor_name: str, donor_email: str, value: float, donation_id: str) -> bool:
    """Envia o recibo. Retorna True se enviado, False em caso de erro/config ausente."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    from_addr = os.environ.get("RESEND_FROM", "")
    public_url = os.environ.get("APP_PUBLIC_URL", "").rstrip("/")
    if not (api_key and from_addr and donor_email):
        return False

    resend.api_key = api_key
    donate_url = f"{public_url}/doacao/pix?don={donation_id}"
    html = _build_html(donor_name, value, donate_url)
    try:
        await resend.Emails.send_async({
            "from": from_addr,
            "to": [donor_email],
            "subject": f"Recibo da sua doação - {CAMPAIGN_NAME}",
            "html": html,
            "text": f"Olá {donor_name}, obrigado por apoiar a campanha {CAMPAIGN_NAME}. Valor: {_format_brl(value)}. Conclua sua doação: {donate_url}",
        })
        return True
    except Exception:
        return False


async def send_donation_reminder(donor_name: str, donor_email: str, value: float, donation_id: str) -> bool:
    """Envia um lembrete de doação. Retorna True se enviado, False em caso de erro/config ausente."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    from_addr = os.environ.get("RESEND_FROM", "")
    public_url = os.environ.get("APP_PUBLIC_URL", "").rstrip("/")
    if not (api_key and from_addr and donor_email):
        return False

    resend.api_key = api_key
    donate_url = f"{public_url}/doacao/pix?don={donation_id}"
    name = escape(donor_name or "Doador(a)")
    campaign = escape(CAMPAIGN_NAME)
    intro = (f"Olá <b>{name}</b>, ainda dá tempo de concluir sua doação para a campanha <b>{campaign}</b>! "
             f"Sua contribuição faz toda a diferença. Confira os detalhes abaixo:")
    html = _build_html(donor_name, value, donate_url, heading="Lembrete da sua doação", intro=intro)
    try:
        await resend.Emails.send_async({
            "from": from_addr,
            "to": [donor_email],
            "subject": f"Lembrete: conclua sua doação - {CAMPAIGN_NAME}",
            "html": html,
            "text": f"Olá {donor_name}, ainda dá tempo de concluir sua doação para a campanha {CAMPAIGN_NAME}. Valor: {_format_brl(value)}. Conclua agora: {donate_url}",
        })
        return True
    except Exception:
        return False
