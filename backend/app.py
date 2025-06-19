from flask import Flask

app = Flask(__name__)

@app.get("/")
def base():
    return "<h1>ME DA IGUAL TODOS VOSOTRO Y TODAS VOSOTRAS</h1>"