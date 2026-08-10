import logging
from pathlib import Path
import joblib
import pandas as pd
import sklearn.compose._column_transformer as column_transformer
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Literal

logging.basicConfig(level=logging.INFO)
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / 'Mental_Health_Model.pkl'

if not hasattr(column_transformer, '_RemainderColsList'):
    class _RemainderColsList(list):
        pass

    column_transformer._RemainderColsList = _RemainderColsList

model = None
try:
    model = joblib.load(MODEL_PATH)
    logging.info('Loaded model from %s successfully', MODEL_PATH)
except Exception as exc:
    logging.error('Could not load model from %s', MODEL_PATH, exc_info=True)

app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_methods=['*'],
        allow_headers=['*'],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            'detail': exc.errors(),
            'body': exc.body,
            'message': 'Validation error in request data.',
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logging.error('Unhandled error: %s', exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={'detail': 'Internal server error. Please try again later.'},
    )

top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

class StudentData(BaseModel):
            age                     : int = Field(..., ge=10, le=100)
            gender                  : Literal['Male','Female']
            country                 : str
            academic_level          : Literal['Undergraduate', 'Graduate', 'High School']
            most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter',
                                        'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat']
            purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']
            avg_daily_usage_hours   : float = Field(..., ge=0 , le=24)
            daily_unlocks           : int = Field(..., ge=0)
            study_hours             : float = Field(..., ge=0, le=24)
            physical_activity_hours : float = Field(..., ge=0, le=2)
            sleep_hours_per_night   : float = Field(..., ge=0, le=24)
            stress_level            : Literal['Medium', 'Low', 'Very High', 'High']

class PredicitonResponse(BaseModel):
        predicted_mental_health_score :float


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/predict', response_model=PredicitonResponse)
def predict(data: StudentData):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail='Model is not available. Please make sure the model file is loaded correctly.',
        )

    country_group = data.country if data.country in top_countries else 'Other'

    input_row = pd.DataFrame([{
        'Age': data.age,
        'Gender': data.gender,
        'Country': data.country,
        'Academic_Level': data.academic_level,
        'Most_Used_Platform': data.most_used_platform,
        'Purpose_Of_Use': data.purpose_of_use,
        'Avg_Daily_Usage_Hours': data.avg_daily_usage_hours,
        'Daily_Unlocks': data.daily_unlocks,
        'Study_Hours': data.study_hours,
        'Physical_Activity_Hours': data.physical_activity_hours,
        'Sleep_Hours_Per_Night': data.sleep_hours_per_night,
        'Stress_Level': data.stress_level,
        'Grouped_Country': country_group
    }])

    try:
        prediction = model.predict(input_row)[0]
        return PredicitonResponse(predicted_mental_health_score=round(float(prediction), 2))
    except Exception as exc:
        logging.error('Prediction failed', exc_info=True)
        raise HTTPException(
            status_code=500,
            detail='Prediction failed due to an internal error.',
        )


app.mount('/', StaticFiles(directory=BASE_DIR, html=True), name='static')


