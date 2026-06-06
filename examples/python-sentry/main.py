"""
faultline + Sentry Python SDK

Install: pip install sentry-sdk
Run:     python main.py
"""

import sentry_sdk

# Point Sentry SDK at faultline
sentry_sdk.init(
    dsn="https://LV0l2yhx7QtWCkoumWCw660e@localhost:4000/1",
    environment="production",
)

# ── 1. Capture an exception ──

try:
    1 / 0
except ZeroDivisionError:
    sentry_sdk.capture_exception()
    print("  ✓ ZeroDivisionError captured")

# ── 2. Capture with context ──

with sentry_sdk.push_scope() as scope:
    scope.user = {"id": "usr_python", "email": "python@example.com"}
    scope.set_tag("feature", "billing")
    scope.set_extra("invoice_id", "inv_456")

    try:
        data = {"user": "alice"}
        print(data["name"])
    except KeyError:
        sentry_sdk.capture_exception()
        print("  ✓ KeyError captured with context")

# ── 3. Capture a message ──

sentry_sdk.capture_message("Scheduled job completed with warnings", level="warning")

print("Done! Check http://localhost:3000/projects")
