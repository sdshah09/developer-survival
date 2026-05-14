from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/")
async def root():
    return {"message": "Hello World"}
