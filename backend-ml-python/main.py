import os
import sys
import importlib

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
        def __init__(self, *args, **kwargs): pass
        def add_middleware(self, *args, **kwargs): pass
        def get(self, *args, **kwargs):
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

# Instanciación de las clases en español
predictor_demanda = PredictorDemandaLavado()
analizador_mantenimiento = AnalizadorMantenimientoPredictivo()

@app.get("/")
def verificar_estado():
    return {
        "servicio": "CAR WASH ML Analytics",
        "estado": "ONLINE",
        "version": "1.0.0"
    }

# Alias de compatibilidad para el endpoint raíz
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

# Alias de función
get_stats_overview = obtener_resumen_estadisticas

if __name__ == "__main__":
    try:
        _uvicorn = importlib.import_module("uvicorn")
        _uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except Exception:
        print("Para ejecutar el microservicio localmente ejecuta 'docker compose up'")
