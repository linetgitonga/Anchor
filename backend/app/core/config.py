import os


class Settings:
    app_name: str = "Anchor API"
    env: str = os.getenv("APP_ENV", "dev")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    jwt_algorithm: str = "HS256"
    access_minutes: int = 30
    refresh_days: int = 14
    database_url: str = os.getenv("DATABASE_URL", "")
    redis_url: str = os.getenv("REDIS_URL", "")

    def ensure_prod(self) -> None:
        if self.env == "prod" and self.jwt_secret == "dev-secret-change-me":
            raise RuntimeError("JWT_SECRET must be set in prod")


settings = Settings()
