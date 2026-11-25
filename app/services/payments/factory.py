import logging
from typing import Optional

from app.core.config import settings
from app.services.payments.base import PaymentProvider
from app.services.payments.cashfree_provider import CashfreeProvider
from app.services.payments.manual_provider import ManualDeskProvider
from app.services.payments.manual_upi_provider import ManualUPIProvider
from app.services.payments.razorpay_provider import RazorpayProvider

logger = logging.getLogger(__name__)

# Registry of available payment providers
PROVIDERS = {
    "razorpay": RazorpayProvider,
    "cashfree": CashfreeProvider,
    "manual_upi": ManualUPIProvider,
    "manual": ManualDeskProvider,
}

_provider_instances = {}


def clear_provider_cache() -> None:
    """Clear cached provider instances (useful in tests or hot reloads)."""
    _provider_instances.clear()


def get_active_provider_name() -> str:
    """Resolve the active payment provider name from settings."""
    mode = getattr(settings, "PAYMENT_MODE", None)
    if mode and str(mode).strip().lower() == "manual":
        return "manual"
    return getattr(settings, "PAYMENT_PROVIDER", "razorpay").strip().lower()


def get_payment_provider(provider_name: Optional[str] = None) -> PaymentProvider:
    """
    Factory function returning the configured payment provider.
    Reads active gateway from PAYMENT_PROVIDER (or PAYMENT_MODE=manual):
      - 'razorpay' (Default)
      - 'cashfree'
      - 'manual_upi'
      - 'manual' (Pay at event desk; no online payments)
    Allows per-request override if provider_name is passed explicitly.
    """
    name = (provider_name or get_active_provider_name()).strip().lower()

    if name not in PROVIDERS:
        logger.warning(f"Unknown payment provider '{name}'. Falling back to 'razorpay'.")
        name = "razorpay"

    if name not in _provider_instances:
        provider_cls = PROVIDERS[name]
        _provider_instances[name] = provider_cls()

    return _provider_instances[name]
