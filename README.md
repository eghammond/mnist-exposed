# MNIST Exposed

Draw a digit in your browser and see how a real PyTorch model classifies it.

**Live app: https://mnist-exposed.onrender.com**

(Hosted on Render's free tier — it spins down after 15 minutes of inactivity, so the first request after idling can take 30-60 seconds to wake back up.)

## What this is

A small web app around a specific trained model: [eghammond/mnist-model](https://github.com/eghammond/mnist-model), a PyTorch MLP (784 → 128 → 64 → 10) trained on MNIST to ~97.78% test accuracy. The backend loads that model's actual weights and preprocessing (the same `Normalize((0.1307,), (0.3081,))` used at training time) so predictions match the original notebook exactly, not an approximation.

## How it works

- **Frontend** (`frontend/`): a plain HTML/CSS/JS canvas. You draw a digit (white on black, matching MNIST's convention), it gets downscaled to 28x28 client-side, and posted to the backend.
- **Backend** (`backend/`): a FastAPI app that loads `mnist_model.pth` into the model architecture from the original notebook, runs inference, and returns the predicted digit plus a softmax probability for each of the 10 classes. It also serves the frontend as static files, so it's a single process.

## Running locally

```
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Then open http://localhost:8000 and draw a digit.

## Deployment

Deployed on [Render](https://render.com) as a single Docker web service (see `Dockerfile`), auto-deploying from `main`.
