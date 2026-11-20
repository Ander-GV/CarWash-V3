import os
import sys
import importlib
from typing import Optional, Dict, Any

# Asegurar resolución de módulos locales independientemente del directorio de ejecución
DIRECTORIO_ACTUAL = os.path.dirname(os.path.abspath(__file__))
if DIRECTORIO_ACTUAL not in sys.path:
    sys.path.insert(0, DIRECTORIO_ACTUAL)

# Carga de FastAPI y CORSMiddleware con fallback seguro para editores sin entorno virtual activo
try:
    _fastapi_mod = importlib.import_module("fastapi")
    FastAPI = getattr(_fastapi_mod, "FastAPI")
    _cors_mod = importlib.import_module("fastapi.middleware.cors")
    CORSMiddleware = getattr(_cors_mod, "CORSMiddleware")
except Exception:
    class FastAPI:
        def __init__(self, *args, **kwargs):
            self.title = kwargs.get("title", "CAR WASH ML Analytics")
            self.description = kwargs.get("description", "")
            self.version = kwargs.get("version", "1.0.0")
        def add_middleware(self, *args, **kwargs): pass
        def get(self, *args, **kwargs):
            return lambda fn: fn
        def post(self, *args, **kwargs):
            return lambda fn: fn

    class CORSMiddleware:
        pass

# Importar las clases del modelo predictivo desde predictor.py local
try:
    from predictor import PredictorDemandaLavado, AnalizadorMantenimientoPredictivo
except ImportError:
    import importlib.util
    ruta_predictor = os.path.join(DIRECTORIO_ACTUAL, "predictor.py")
    spec = importlib.util.spec_from_file_location("predictor", ruta_predictor)
    if spec and spec.loader:
        _pred_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(_pred_mod)
        PredictorDemandaLavado = getattr(_pred_mod, "PredictorDemandaLavado")
        AnalizadorMantenimientoPredictivo = getattr(_pred_mod, "AnalizadorMantenimientoPredictivo")
    else:
        raise

app = FastAPI(
    title="CAR WASH - Microservicio de Analítica Predictiva e Inteligencia Vehicular",
    description="Microservicio en Python para modelado de demanda (RandomForestRegressor), retención de placas y mantenimiento preventivo.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instanciación de las clases del modelo de ML
predictor_demanda = PredictorDemandaLavado()
analizador_mantenimiento = AnalizadorMantenimientoPredictivo()

@app.get("/")
def verificar_estado():
    return {
        "servicio": "CAR WASH ML Analytics",
        "estado": "ONLINE",
        "version": "2.0.0",
        "modeloActivo": predictor_demanda.model_metrics.get("modelName"),
        "entrenadoEnDatosReales": predictor_demanda.model_metrics.get("isTrainedOnRealData"),
        "muestrasEntrenadas": predictor_demanda.model_metrics.get("trainingSamples")
    }

# Alias de compatibilidad
health_check = verificar_estado

@app.get("/predict/demand")
def obtener_prediccion_demanda():
    return predictor_demanda.predecir_proximos_7_dias()

# Alias de función
get_demand_prediction = obtener_prediccion_demanda

@app.get("/predict/loyalty")
def obtener_analisis_fidelizacion():
    return predictor_demanda.analizar_fidelidad_vehicular()

# Alias de función
get_loyalty_analytics = obtener_analisis_fidelizacion

@app.get("/predict/maintenance")
def obtener_prediccion_mantenimiento():
    return analizador_mantenimiento.evaluar_componentes()

# Alias de función
get_maintenance_prediction = obtener_prediccion_mantenimiento

@app.get("/stats/overview")
def obtener_resumen_estadisticas():
    # Retorna las métricas dinámicas reales calculadas por el modelo entrenado
    return predictor_demanda.model_metrics

# Alias de función
get_stats_overview = obtener_resumen_estadisticas

@app.post("/train")
def reentrenar_modelo():
    """
    Endpoint para forzar reentrenamiento con datos frescos de la base de datos PostgreSQL.
    """
    metricas = predictor_demanda.entrenar_modelo()
    return {
        "success": True,
        "message": "Modelo RandomForestRegressor re-entrenado y pesos de demanda actualizados",
        "metrics": metricas
    }

@app.post("/sync-data")
def sincronizar_sesiones(payload: Optional[Dict[str, Any]] = None):
    """
    Permite a NestJS enviar las sesiones de lavado registradas para reentrenar el modelo
    incluso si los microservicios no comparten red directa de base de datos.
    """
    sessions = (payload or {}).get("sessions", [])
    predictor_demanda.sincronizar_datos(sessions)
    return {
        "success": True,
        "registrosSincronizados": len(sessions),
        "metrics": predictor_demanda.model_metrics
    }

if __name__ == "__main__":
    try:
        _uvicorn = importlib.import_module("uvicorn")
        _uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception:
        print("Para ejecutar el microservicio localmente ejecuta 'docker compose up' o 'uvicorn main:app --port 8000'")
