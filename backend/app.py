import os
from flask import Flask, send_from_directory


base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))
app = Flask(__name__, static_folder=base_dir, static_url_path='') 

@app.route("/")
def serve_index():
    """Sirve el archivo index.html directamente desde la carpeta estática."""
    print(f"Sirviendo index.html desde: {os.path.join(app.static_folder, 'index.html')}")
    
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    app.run(debug=True)