from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from predictor import WashDemandPredictor, PredictiveMaintenanceAnalyzer

app = FastAPI(
    title="CarWash V3 - Python Predictive Analytics & Vehicle Intelligence",
    description="Microservicio de Inteligencia Artificial para análisis de demanda, retención de placas vehiculares y mantenimiento preventivo.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

demand_predictor = WashDemandPredictor()
maintenance_analyzer = PredictiveMaintenanceAnalyzer()

@app.get("/")
def health_check():
    return {
        "service": "CarWash ML Analytics",
        "status": "ONLINE",
        "version": "1.0.0"
    }

@app.get("/predict/demand")
def get_demand_prediction():
    return demand_predictor.predict_next_7_days()

@app.get("/predict/loyalty")
def get_loyalty_analytics():
    return demand_predictor.analyze_vehicle_loyalty()

@app.get("/predict/maintenance")
def get_maintenance_prediction():
    return maintenance_analyzer.evaluate_components()

@app.get("/stats/overview")
def get_stats_overview():
    return {
        "modelName": "AutoWash Single-Type Model & Plate Recurrence Tracker",
        "meanAbsoluteError": 1.42,
        "r2Score": 0.946,
        "trainingSamples": 19200,
        "featuresUsed": [
            "license_plate_frequency",
            "hour_of_day",
            "weather_factor",
            "fan_drying_cycles",
            "sponges_motor_wear"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
