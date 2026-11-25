import hmac
import hashlib
import json
import pytest
from unittest.mock import patch, MagicMock

from app.core.config import settings
from app.services.payments.base import NormalizedPaymentStatus
from app.services.payments.razorpay_provider import RazorpayProvider
from app.services.payments.cashfree_provider import CashfreeProvider
from app.services.payments.manual_provider import ManualDeskProvider
from app.services.payments.manual_upi_provider import ManualUPIProvider
from app.services.payments.factory import get_payment_provider, clear_provider_cache


# ═══════════════════════════════════════════════════════════════════
# 1. Razorpay Signature Verification (Valid vs Tampered)
# ═══════════════════════════════════════════════════════════════════

def test_razorpay_signature_verification_valid():
    """Verify that a genuine HMAC-SHA256 signature is accepted."""
    secret = "test_key_secret_xyz123"
    order_id = "order_N4k2J8xY123abc"
    payment_id = "pay_N4k3M9zZ456def"

    msg = f"{order_id}|{payment_id}".encode("utf-8")
    valid_signature = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    provider = RazorpayProvider(key_id="rzp_test_123", key_secret=secret)
    assert provider.verify_payment_signature(order_id, payment_id, valid_signature) is True


def test_razorpay_signature_verification_tampered():
    """Verify that a tampered signature, tampered order_id, or tampered payment_id is rejected."""
    secret = "test_key_secret_xyz123"
    order_id = "order_N4k2J8xY123abc"
    payment_id = "pay_N4k3M9zZ456def"

    msg = f"{order_id}|{payment_id}".encode("utf-8")
    valid_signature = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    provider = RazorpayProvider(key_id="rzp_test_123", key_secret=secret)

    # 1. Altered signature character
    tampered_sig = valid_signature[:-2] + "ff"
    assert provider.verify_payment_signature(order_id, payment_id, tampered_sig) is False

    # 2. Tampered order_id
    assert provider.verify_payment_signature("order_TAMPERED123", payment_id, valid_signature) is False

    # 3. Tampered payment_id
    assert provider.verify_payment_signature(order_id, "pay_TAMPERED456", valid_signature) is False

    # 4. Empty signature
    assert provider.verify_payment_signature(order_id, payment_id, "") is False


# ═══════════════════════════════════════════════════════════════════
# 2. Razorpay Webhook Signature & Idempotency
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_razorpay_webhook_signature_valid():
    """Verify webhook raw body signature validation passes with correct secret."""
    webhook_secret = "whsec_test_secret_987654"
    provider = RazorpayProvider(webhook_secret=webhook_secret)

    payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_999",
                    "order_id": "order_test_888",
                    "status": "captured",
                    "amount": 25000,
                    "currency": "INR",
                }
            }
        }
    }
    raw_body = json.dumps(payload).encode("utf-8")
    valid_sig = hmac.new(webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    result = await provider.handle_webhook(raw_body, {"x-razorpay-signature": valid_sig})
    assert result.success is True
    assert result.event_type == "payment.captured"
    assert result.order_id == "order_test_888"
    assert result.payment_id == "pay_test_999"
    assert result.status == NormalizedPaymentStatus.PAID


@pytest.mark.asyncio
async def test_razorpay_webhook_signature_tampered():
    """Verify webhook raw body with invalid signature is rejected."""
    webhook_secret = "whsec_test_secret_987654"
    provider = RazorpayProvider(webhook_secret=webhook_secret)

    raw_body = b'{"event": "payment.captured"}'
    invalid_sig = "invalid_hash_signature"

    result = await provider.handle_webhook(raw_body, {"x-razorpay-signature": invalid_sig})
    assert result.success is False
    assert "invalid" in result.message.lower()


@pytest.mark.asyncio
async def test_razorpay_webhook_idempotency():
    """
    Test webhook idempotency:
    If a registration is already PAID (e.g. return URL verify completed first),
    re-running webhook handling does not raise error and preserves status.
    """
    provider = RazorpayProvider()

    # Simulate webhook result on captured payment
    raw_payload = json.dumps({
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_idempotent_123",
                    "order_id": "order_idempotent_456",
                    "status": "captured",
                    "amount": 50000,
                }
            }
        }
    }).encode("utf-8")

    with patch.object(provider, "verify_webhook_signature", return_value=True):
        # 1st delivery
        res1 = await provider.handle_webhook(raw_payload, {"x-razorpay-signature": "dummy"})
        assert res1.success is True
        assert res1.status == NormalizedPaymentStatus.PAID

        # 2nd delivery (Razorpay retry)
        res2 = await provider.handle_webhook(raw_payload, {"x-razorpay-signature": "dummy"})
        assert res2.success is True
        assert res2.status == NormalizedPaymentStatus.PAID
        assert res2.order_id == res1.order_id
        assert res2.payment_id == res1.payment_id


# ═══════════════════════════════════════════════════════════════════
# 3. Provider Switching via Config / Env
# ═══════════════════════════════════════════════════════════════════

def test_provider_switching_razorpay(monkeypatch):
    """Verify PAYMENT_PROVIDER=razorpay resolves to RazorpayProvider."""
    clear_provider_cache()
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "razorpay")
    provider = get_payment_provider()
    assert isinstance(provider, RazorpayProvider)
    assert provider.name == "razorpay"


def test_provider_switching_cashfree(monkeypatch):
    """Verify PAYMENT_PROVIDER=cashfree resolves to CashfreeProvider."""
    clear_provider_cache()
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "cashfree")
    provider = get_payment_provider()
    assert isinstance(provider, CashfreeProvider)
    assert provider.name == "cashfree"


def test_provider_switching_manual_upi(monkeypatch):
    """Verify PAYMENT_PROVIDER=manual_upi resolves to ManualUPIProvider."""
    clear_provider_cache()
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "manual_upi")
    provider = get_payment_provider()
    assert isinstance(provider, ManualUPIProvider)
    assert provider.name == "manual_upi"


# ═══════════════════════════════════════════════════════════════════
# 4. Manual UPI Provider Order Creation
# ═══════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_manual_upi_order_creation():
    """Verify ManualUPIProvider creates an order with PENDING_MANUAL and a valid UPI URI."""
    provider = ManualUPIProvider(upi_id="asthra@okaxis", upi_name="Asthra Fest")
    result = await provider.create_order(
        order_id="UPI_ORD_TEST123",
        amount=150.0,
        customer_id="cust_test_1",
        customer_name="Test Student",
        customer_email="student@example.com",
        customer_phone="9876543210",
        receipt="ASTHRA-TEST-001",
    )
    assert result.status == NormalizedPaymentStatus.PENDING_MANUAL
    assert result.upi_id == "asthra@okaxis"
    assert "upi://pay" in result.qr_payload
    assert "ASTHRA-TEST-001" in result.qr_payload
    assert result.provider == "manual_upi"


def test_provider_switching_manual_desk(monkeypatch):
    """Verify PAYMENT_PROVIDER=manual and PAYMENT_MODE=manual resolve to ManualDeskProvider."""
    clear_provider_cache()
    monkeypatch.setattr(settings, "PAYMENT_MODE", None)
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "manual")
    provider = get_payment_provider()
    assert isinstance(provider, ManualDeskProvider)
    assert provider.name == "manual"

    clear_provider_cache()
    monkeypatch.setattr(settings, "PAYMENT_PROVIDER", "razorpay")
    monkeypatch.setattr(settings, "PAYMENT_MODE", "manual")
    provider2 = get_payment_provider()
    assert isinstance(provider2, ManualDeskProvider)
    assert provider2.name == "manual"


@pytest.mark.asyncio
async def test_manual_desk_order_creation():
    """Verify ManualDeskProvider creates a local pay-at-desk order with PENDING_MANUAL."""
    provider = ManualDeskProvider()
    result = await provider.create_order(
        order_id="ATHRA_TEST_1",
        amount=200.0,
        customer_id="cust_desk_1",
        customer_name="Desk Student",
        customer_email="desk@example.com",
        customer_phone="9876543210",
        receipt="ASTHRA-DESK-001",
    )
    assert result.provider == "manual"
    assert result.status == NormalizedPaymentStatus.PENDING_MANUAL
    assert result.order_id.startswith("DESK_")
    assert result.checkout_data.get("is_manual_desk") is True
    assert "payment desk" in result.checkout_data.get("message", "").lower()
