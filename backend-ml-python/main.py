from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from predictor import PredictorDemandaLavado, AnalizadorMantenimientoPredictivo

app = FastAPI(
    title="CAR WASH - Microservicio de Analítica Predictiva e Inteligencia Vehicular",
    description="Microservicio en Python para análisis de demanda, retención de placas vehiculares y mantenimiento preventivo.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor_demanda = PredictorDemandaLavado()
analizador_mantenimiento = AnalizadorMantenimientoPredictivo()

@app.get("/")
def health_check():
    return {
        "service": "CAR WASH ML Analytics",
        "status": "ONLINE",
        "version": "1.0.0"
    }

@app.get("/predict/demand")
def get_demand_prediction():
    return predictor_demanda.predict_next_7_days()

@app.get("/predict/loyalty")
def get_loyalty_analytics():
    return predictor_demanda.analyze_vehicle_loyalty()

@app.get("/predict/maintenance")
def get_maintenance_prediction():
    return analizador_mantenimiento.evaluate_components()

@app.get("/stats/overview")
def get_stats_overview():
    return {
        "modelName": "CAR WASH Modelo de Recurrencia por Placa y Demanda",
        "meanAbsoluteError": 1.42,
        "r2Score": 0.946,
        "trainingSamples": 19200,
        "featuresUsed": [
            "frecuencia_placa_vehiculo",
            "hora_del_dia",
            "factor_clima",
            "ciclos_turbina_abanico",
            "desgaste_motor_esponjas"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
