"""Logging helpers for consistent API and service observability."""

import logging
from logging.config import dictConfig


def configure_logging(log_level: str = "INFO") -> None:
    """Configure application-wide structured console logging."""

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                }
            },
            "root": {
                "handlers": ["console"],
                "level": log_level,
            },
        }
    )


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced logger instance."""

    return logging.getLogger(name)

