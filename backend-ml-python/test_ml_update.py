import sys
import os
from datetime import datetime, timedelta

# Asegurar path
DIR_ACTUAL = os.path.dirname(os.path.abspath(__file__))
if DIR_ACTUAL not in sys.path:
    sys.path.insert(0, DIR_ACTUAL)

from predictor import PredictorDemandaLavado, AnalizadorMantenimientoPredictivo

def ejecutar_prueba():
    print("=" * 75)
    print(">>> 1. ESTADO INICIAL (SIN REGISTROS REALES ACUMULADOS)")
    print("=" * 75)

    predictor = PredictorDemandaLavado()
    analizador = AnalizadorMantenimientoPredictivo()

    pred_ini = predictor.predecir_proximos_7_dias()
    maint_ini = analizador.evaluar_componentes()

    print(f"• Muestras de entrenamiento iniciales: {predictor.model_metrics['trainingSamples']}")
    print(f"• Datos reales en modelo: {predictor.model_metrics['isTrainedOnRealData']}")
    print(f"• Pesos por día iniciales: {predictor.day_weights}")
    print(f"• Lavados proyectados 7 días: {pred_ini['summary']['totalPredictedWashes']}")
    print(f"• Ingresos proyectados 7 días: COP ${pred_ini['summary']['estimatedWeeklyRevenue']:,}")
    print(f"• Salud global maquinaria inicial: {maint_ini['overallSystemIntegrity']}")
    print("• Odómetro inicial componentes:")
    for c in maint_ini["components"]:
        print(f"   [{c['name']}]: {c['totalCycles']} ciclos | Salud: {c['healthScore']}% | Restante: {c['cyclesToNextService']} ciclos")

    print("\n" + "=" * 75)
    print(">>> 2. SIMULACIÓN: SE REGISTRAN 250 LAVADOS REALES EN EL SISTEMA")
    print("=" * 75)

    nuevas_sesiones = []
    ahora = datetime.now()
    placas_frecuentes = ["KLO-892", "ABC-123", "XYZ-999", "TAX-444", "UBR-777", "MKO-221"]

    for i in range(250):
        dias_atras = i % 14
        fecha_lavado = ahora - timedelta(days=dias_atras, hours=(i % 10))
        placa = placas_frecuentes[i % len(placas_frecuentes)]
        nuevas_sesiones.append({
            "id": f"real-wash-{i}",
            "license_plate": placa,
            "payment_status": "APPROVED",
            "amount": 20000,
            "created_at": fecha_lavado,
            "finish_time": fecha_lavado + timedelta(minutes=15)
        })

    # Inyectar las sesiones reales en el predictor y en el analizador de maquinaria
    predictor.sincronizar_datos(nuevas_sesiones)
    analizador.db.extraer_sesiones_aprobadas = lambda: nuevas_sesiones

    print(">> Sincronización realizada. Re-entrenando modelo...")

    pred_act = predictor.predecir_proximos_7_dias()
    maint_act = analizador.evaluar_componentes()
    fidelidad_act = predictor.analizar_fidelidad_vehicular()

    print("\n" + "=" * 75)
    print(">>> 3. RESULTADOS TRAS LA ACTUALIZACIÓN CON DATOS REALES")
    print("=" * 75)

    print("\n[A. MODELO DE MACHINE LEARNING ACTUALIZADO]")
    print(f"• Muestras reales procesadas: {predictor.model_metrics['realSamplesCount']}")
    print(f"• ¿Entrenado en datos reales de BD?: {predictor.model_metrics['isTrainedOnRealData']}")
    print(f"• Precisión del modelo (R² Score): {predictor.model_metrics['r2Score'] * 100:.1f}%")
    print(f"• Error Absoluto Medio (MAE): {predictor.model_metrics['meanAbsoluteError']}")
    print(f"• Proyección 7 días: {pred_act['summary']['totalPredictedWashes']} lavados (vs {pred_ini['summary']['totalPredictedWashes']} inicial)")
    print(f"• Ingresos proyectados: COP ${pred_act['summary']['estimatedWeeklyRevenue']:,} (vs COP ${pred_ini['summary']['estimatedWeeklyRevenue']:,} inicial)")
    print(f"• Tasa de retención por placa calculada: {fidelidad_act['retentionRate']}")
    print(f"• Tasa de conversión fidelización: {fidelidad_act['loyaltyConversionRate']}")

    print("\n[B. MANTENIMIENTO PREVENTIVO DE MAQUINARIA ACTUALIZADO]")
    print(f"• Lavados reales sumados a los actuadores: +{maint_act['realWashCyclesIncorporated']} ciclos")
    print(f"• Integridad general del sistema: {maint_act['overallSystemIntegrity']} (Inicial: {maint_ini['overallSystemIntegrity']})")
    print("\nTabla comparativa de desgaste de actuadores:")
    print(f"{'Componente':<38} | {'Ciclos Antes':<12} | {'Ciclos Ahora':<12} | {'Salud':<10} | {'Próx. Servicio'}")
    print("-" * 95)
    for c_ini, c_act in zip(maint_ini["components"], maint_act["components"]):
        nom = c_act["name"][:36]
        cic_ini = c_ini["totalCycles"]
        cic_act = c_act["totalCycles"]
        salud = f"{c_ini['healthScore']}% -> {c_act['healthScore']}%"
        prox = f"{c_act['cyclesToNextService']} ciclos restantes"
        print(f"{nom:<38} | {cic_ini:<12} | {cic_act:<12} | {salud:<10} | {prox}")

if __name__ == "__main__":
    ejecutar_prueba()

