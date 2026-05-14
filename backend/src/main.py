from contextlib import asynccontextmanager

from fastapi import FastAPI

from ai.openai_deepseek import Chat
from api.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing AI Client...")
    app.state.chat_client = Chat()

    yield

    print("Shutting down AI Client...")
    app.state.chat_client = None


app = FastAPI(lifespan=lifespan)

# Include our chat routes
app.include_router(chat_router)


@app.get("/")
async def root():
    return {"message": "Hello World"}
