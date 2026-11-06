"""
Gerador de payload PIX BR Code (EMV QR Code) valido.
Segue o padrao EMV QRCPS para pagamentos PIX.
"""


def _tlv(tag: str, value: str) -> str:
    """Gera um campo TLV (Tag-Length-Value)."""
    length = str(len(value)).zfill(2)
    return f"{tag}{length}{value}"


def _crc16(payload: str) -> str:
    """Calcula o CRC16 CCITT (0xFFFF) do payload."""
    crc = 0xFFFF
    for byte in payload.encode("ascii"):
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return format(crc, "04X")


def generate_pix_payload(
    pix_key: str,
    amount: float,
    merchant_name: str = "AACD",
    merchant_city: str = "SAO PAULO",
    description: str = "***",
) -> str:
    """
    Gera um payload PIX BR Code valido.

    Args:
        pix_key: Chave PIX (email, telefone, CPF/CNPJ ou chave aleatoria)
        amount: Valor da transacao em BRL
        merchant_name: Nome do recebedor (max 25 chars)
        merchant_city: Cidade do recebedor (max 15 chars)
        description: Descricao/referencia

    Returns:
        String do payload PIX pronta para gerar QR Code
    """
    merchant_name = merchant_name[:25]
    merchant_city = merchant_city[:15]

    # Tag 26 - Merchant Account Information (PIX)
    gui = _tlv("00", "br.gov.bcb.pix")
    key = _tlv("01", pix_key)
    merchant_account = _tlv("26", gui + key)

    # Tag 62 - Additional Data Field
    ref_label = _tlv("05", description)
    additional_data = _tlv("62", ref_label)

    # Monta o payload sem CRC
    payload = (
        _tlv("00", "01")  # Payload Format Indicator
        + _tlv("01", "12")  # Point of Initiation Method (12 = dinamico)
        + merchant_account
        + _tlv("52", "0000")  # Merchant Category Code
        + _tlv("53", "986")  # Transaction Currency (BRL)
        + _tlv("54", f"{amount:.2f}")  # Transaction Amount
        + _tlv("58", "BR")  # Country Code
        + _tlv("59", merchant_name)  # Merchant Name
        + _tlv("60", merchant_city)  # Merchant City
        + additional_data
    )

    # Adiciona tag 63 (CRC16) - o valor sera calculado sobre todo o payload incluindo "6304"
    payload += "6304"
    crc = _crc16(payload)
    payload += crc

    return payload
