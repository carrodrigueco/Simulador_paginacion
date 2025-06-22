import os
from flask import Flask, send_from_directory, request, jsonify


base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
app = Flask(__name__, static_folder=base_dir, static_url_path='') 

def pagina_en_ram(pagina:str, ram:list)->bool:
    for pagina_cargada in ram:
        if pagina_cargada is None:
            return False
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

    #PASADA PARA FIFO
    RAM: list = [None, None, None, None]
    espacio: int = 4
    llegada: int = 1
    for time, pagina in enumerate(data["sequence"]):
        restante: list = data["sequence"][time+1:]
        if(pagina_en_ram(pagina=pagina, ram=RAM)):
            fifo["steps"].append({"mensaje": f"La pagina [ {pagina} ] ya esta cargada en RAM",
                                  "resto": f"{restante}",
                                  "paginas_afectadas": [pagina],
                                  "fault": None})
        elif (espacio > 0):
            RAM[-espacio] = [llegada, pagina]
            espacio -= 1
            llegada += 1
            fifo["steps"].append({"mensaje": f"Se agrega la pagina [ {pagina} ] pues hay espacio en RAM",
                                  "resto": f"{restante}",
                                  "paginas_afectadas": [pagina],
                                  "fault": None})
            continue
        else:
            fifo["faults"] += 1
            for index, pagina_cargada in enumerate(RAM):
                if(pagina_cargada[0] == 1):
                    RAM[index] = [4, pagina]
                    fifo["steps"].append({"mensaje": f"Se agrega la pagina [ {pagina} ], se descarga la pagina [ {pagina_cargada[1]} ]",
                                  "resto": f"{restante}",
                                  "paginas_afectadas": [pagina, pagina_cargada[1]],
                                  "fault": True})
                else:
                    RAM[index] = [RAM[index][0] - 1, RAM[index][1]]

    RAM: list = [None, None, None, None]
    espacio: int = 4
    llegada: int = 1
    for time, pagina in enumerate(data["sequence"]):
        print("ayuda")
    return jsonify({"fifo": fifo, "lru": lru})



if __name__ == "__main__":
    app.run(debug=True)