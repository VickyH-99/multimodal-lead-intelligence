"""Database engine and session management."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


class DatabaseManager:
    """Encapsulates engine creation and session handling."""

    def __init__(self) -> None:
        self._engine = None
        self._session_factory: sessionmaker[Session] | None = None

    def configure(self, database_url: str) -> None:
        """Create or replace the SQLAlchemy engine and session factory."""

        connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
        engine_kwargs = {"future": True}
        if database_url in {"sqlite://", "sqlite:///:memory:", "sqlite+pysqlite:///:memory:"}:
            engine_kwargs["poolclass"] = StaticPool
        self._engine = create_engine(
            database_url,
            connect_args=connect_args,
            **engine_kwargs,
        )
        self._session_factory = sessionmaker(
            bind=self._engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
        )

    @property
    def engine(self):
        """Return the configured SQLAlchemy engine."""

        if self._engine is None:
            raise RuntimeError("Database engine is not configured.")
        return self._engine

    def create_all(self) -> None:
        """Create all database tables."""

        Base.metadata.create_all(bind=self.engine)

    def drop_all(self) -> None:
        """Drop all database tables."""

        Base.metadata.drop_all(bind=self.engine)

    def session(self) -> Generator[Session, None, None]:
        """Yield a database session."""

        if self._session_factory is None:
            raise RuntimeError("Database session factory is not configured.")
        db = self._session_factory()
        try:
            yield db
        finally:
            db.close()


database = DatabaseManager()
