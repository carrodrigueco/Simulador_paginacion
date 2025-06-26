import os
from flask import Flask, send_from_directory, request, jsonify

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
app = Flask(__name__, static_folder=base_dir, static_url_path='')

def pagina_en_ram(pagina: str, ram: list) -> tuple[bool, int]:
    for index, pagina_cargada in enumerate(ram):
        if pagina_cargada is None:
            continue
        if isinstance(pagina_cargada, list) and pagina == pagina_cargada[1]:  # FIFO
            return True, index
        elif isinstance(pagina_cargada, dict) and pagina in pagina_cargada:   # LRU
            return True, index
    return False, -1

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.post("/simulate")
def simulate():
    data: dict = request.get_json()

    fifo = {"steps": [], "stats": {"hit": 0, "faults": 0, "discard": 0}}
    lru = {"steps": [], "stats": {"hit": 0, "faults": 0, "discard": 0}}

    # === FIFO ===
    RAM_fifo = [None] * 4
    llegada_fifo = 1

    for time_step, pagina_ref in enumerate(data["sequence"]):
        esta_en_ram, _ = pagina_en_ram(pagina=pagina_ref, ram=RAM_fifo)

        if esta_en_ram:
            fifo["stats"]["hit"] += 1
            is_fault_for_step = False
        else:
            is_fault_for_step = True
            fifo["stats"]["faults"] += 1

            espacio_vacio_idx = next((i for i, val in enumerate(RAM_fifo) if val is None), -1)
            if espacio_vacio_idx != -1:
                RAM_fifo[espacio_vacio_idx] = [llegada_fifo, pagina_ref]
            else:
                fifo["stats"]["discard"] += 1
                pagina_a_reemplazar_idx = min(
                    range(len(RAM_fifo)),
                    key=lambda i: RAM_fifo[i][0]
                )
                RAM_fifo[pagina_a_reemplazar_idx] = [llegada_fifo, pagina_ref]

            llegada_fifo += 1

        current_frames_for_frontend_fifo = [p[1] if p is not None else '' for p in RAM_fifo]

        fifo["steps"].append({
            "time": time_step + 1,
            "page": pagina_ref,
            "frames": current_frames_for_frontend_fifo,
            "fault": is_fault_for_step
        })

    # === LRU ===
    RAM_lru = [None] * 4
    lru_time = 0

    for time_step, pagina_ref in enumerate(data["sequence"]):
        lru_time += 1
        esta_en_ram, index_en_ram = pagina_en_ram(pagina=pagina_ref, ram=RAM_lru)

        if esta_en_ram:
            RAM_lru[index_en_ram][pagina_ref][1] = lru_time
            lru["stats"]["hit"] += 1
            is_fault_for_step = False
        else:
            is_fault_for_step = True
            lru["stats"]["faults"] += 1

            espacio_vacio_idx = next((i for i, val in enumerate(RAM_lru) if val is None), -1)
            if espacio_vacio_idx != -1:
                RAM_lru[espacio_vacio_idx] = {pagina_ref: [lru_time, lru_time]}
            else:
                lru["stats"]["discard"] += 1
                lru_page_to_replace_idx = min(
                    range(len(RAM_lru)),
                    key=lambda i: list(RAM_lru[i].values())[0][1]
                )
                RAM_lru[lru_page_to_replace_idx] = {pagina_ref: [lru_time, lru_time]}

        frames_estado_lru = [
            list(bloque.keys())[0] if bloque else ''
            for bloque in RAM_lru
        ]

        lru["steps"].append({
            "time": time_step + 1,
            "page": pagina_ref,
            "frames": frames_estado_lru,
            "fault": is_fault_for_step
        })

    return jsonify({"fifo": fifo, "lru": lru})

if __name__ == "__main__":
    app.run(debug=True)
