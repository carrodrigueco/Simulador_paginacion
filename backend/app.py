import os
from flask import Flask, send_from_directory, request, jsonify

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
app = Flask(__name__, static_folder=base_dir, static_url_path='') 

def pagina_en_ram(pagina:str, ram:list)->bool:
    for pagina_cargada in ram:
        if pagina_cargada is None:
            continue
        if(pagina == pagina_cargada[1]):
            return True
    return False

@app.route("/")
def serve_index():
    """Sirve el archivo index.html directamente desde la carpeta estática."""
    print(f"Sirviendo index.html desde: {os.path.join(app.static_folder, 'index.html')}")
    return send_from_directory(app.static_folder, 'index.html')

@app.post("/simulate")
def simulando():
    data: dict = request.get_json()
    fifo: dict = {"steps": [], "faults": 0}
    lru: dict = {"steps": [], "faults": 0}

    # PASADA PARA FIFO
    RAM_fifo: list = [None, None, None, None] # Usa RAM_fifo para evitar conflicto de nombre
    espacio_fifo: int = 4
    llegada_fifo: int = 1

    for time_step, pagina_ref in enumerate(data["sequence"]): 
        is_fault = False

        if pagina_en_ram(pagina=pagina_ref, ram=RAM_fifo):
            
            pass 
        elif espacio_fifo > 0:
            
            is_fault = True
            fifo["faults"] += 1
            RAM_fifo[-espacio_fifo] = [llegada_fifo, pagina_ref]
            espacio_fifo -= 1
            llegada_fifo += 1
        else:
           
            is_fault = True
            fifo["faults"] += 1
            
            pagina_a_reemplazar_idx = -1
            min_llegada = float('inf') 
            for index, pagina_cargada in enumerate(RAM_fifo):
                if pagina_cargada is not None and pagina_cargada[0] < min_llegada:
                    min_llegada = pagina_cargada[0]
                    pagina_a_reemplazar_idx = index
            
            if pagina_a_reemplazar_idx != -1:
               
                RAM_fifo[pagina_a_reemplazar_idx] = [llegada_fifo, pagina_ref]
     
            for index in range(len(RAM_fifo)):
                if RAM_fifo[index] is not None and index != pagina_a_reemplazar_idx:
                   
                    RAM_fifo[index][0] -= 1
                elif RAM_fifo[index] is None and index != pagina_a_reemplazar_idx:

                    pass 
            
            llegada_fifo += 1

        # Prepara el estado actual de la RAM para el frontend
        current_frames_for_frontend = [p[1] if p is not None else '' for p in RAM_fifo]

        fifo["steps"].append({
            "time": time_step + 1, # El tiempo del paso (empezando en 1)
            "page": pagina_ref,    # La página de referencia
            "frames": current_frames_for_frontend, # Estado de los marcos
            "fault": is_fault      # Si hubo un fallo en este paso
        })
    
    # Lógica para LRU
    # Por ahora, un mock para que el frontend no falle
    mock_lru_steps = []
    mock_lru_faults = 0
    # Simplemente rellenar con algunos datos vacíos o un mock simple si se quiere ver la tabla
    for i in range(len(data["sequence"])):
        mock_lru_steps.append({
            "time": i + 1,
            "page": data["sequence"][i],
            "frames": ['', '', '', ''], # Marcos vacíos o mock
            "fault": False
        })
    lru["steps"] = mock_lru_steps
    lru["faults"] = mock_lru_faults


    return jsonify({"fifo": fifo, "lru": lru})


if __name__ == "__main__":
    app.run(debug=True)