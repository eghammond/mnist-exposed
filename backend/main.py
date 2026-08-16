from pathlib import Path

import torch
import torch.nn.functional as F
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from model import SimpleNN

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

MNIST_MEAN = 0.1307
MNIST_STD = 0.3081

model = SimpleNN()
model.load_state_dict(torch.load(BASE_DIR / "mnist_model.pth", map_location="cpu"))
model.eval()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    # 28x28 grayscale pixels, row-major, values in [0, 1], white-on-black
    pixels: list[list[float]] = Field(..., min_length=28, max_length=28)


class PredictResponse(BaseModel):
    prediction: int
    probabilities: list[float]


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    tensor = torch.tensor(req.pixels, dtype=torch.float32).reshape(1, 1, 28, 28)
    tensor = (tensor - MNIST_MEAN) / MNIST_STD

    with torch.no_grad():
        logits = model(tensor)
        probabilities = F.softmax(logits, dim=1).squeeze(0).tolist()

    prediction = int(torch.argmax(logits, dim=1).item())
    return PredictResponse(prediction=prediction, probabilities=probabilities)


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
