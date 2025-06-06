from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Константи напряму в файлі (замість імпорту з config)
ROOM_ID = "room_9326"
FILTERS = ["invert", "blur"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8001"],
    allow_credentials=True,  # Виправлено з allow_credential на allow_credentials
    allow_methods=["*"],
    allow_headers=["*"],
)

_store = []

@app.post("/draw/{room_id}")
def draw(room_id: str, command: dict):
    if room_id != ROOM_ID:
        raise HTTPException(status_code=404, detail="Room not found")
    _store.append(command)
    return {"status": "ok"}

@app.get("/draw/{room_id}")
def get_draw(room_id: str):
    if room_id != ROOM_ID:
        raise HTTPException(status_code=404, detail="Room not found")
    return _store

def apply_filter_python(data, width, height, filter_name):
    """Тимчасова Python реалізація фільтрів"""
    if filter_name == "invert":
        # Інвертуємо кольори
        result = []
        for i in range(0, len(data), 4):
            result.extend([
                255 - data[i],      # Red
                255 - data[i+1],    # Green  
                255 - data[i+2],    # Blue
                data[i+3]           # Alpha (не змінюємо)
            ])
        return result
    
    elif filter_name == "blur":
        # Простий blur ефект (зменшуємо контрастність)
        result = []
        for i in range(0, len(data), 4):
            # Зменшуємо контрастність для імітації blur
            r = int(data[i] * 0.8 + 32)
            g = int(data[i+1] * 0.8 + 32) 
            b = int(data[i+2] * 0.8 + 32)
            result.extend([r, g, b, data[i+3]])
        return result
    
    # Якщо фільтр невідомий, повертаємо оригінал
    return data

@app.post("/filter/{room_id}")
async def filter_image(room_id: str, payload: dict):
    try:
        # Перевіряємо room_id
        if room_id != ROOM_ID:
            raise HTTPException(status_code=404, detail="Room not found")
            
        # Перевіряємо наявність необхідних полів
        if "image_data" not in payload:
            raise HTTPException(status_code=400, detail="Missing image_data")
        if "width" not in payload:
            raise HTTPException(status_code=400, detail="Missing width")
        if "height" not in payload:
            raise HTTPException(status_code=400, detail="Missing height")
        if "filter_name" not in payload:
            raise HTTPException(status_code=400, detail="Missing filter_name")
        
        data = payload["image_data"]
        width = payload["width"]
        height = payload["height"]
        filter_name = payload["filter_name"]
        
        # Перевіряємо чи фільтр існує
        if filter_name not in FILTERS:
            raise HTTPException(status_code=400, detail=f"Unknown filter: {filter_name}")
        
        # Перевіряємо чи дані коректні
        if not isinstance(data, list) or len(data) != width * height * 4:
            raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Застосовуємо фільтр
        filtered = apply_filter_python(data, width, height, filter_name)
        return {"image_data": filtered}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Filter processing error: {str(e)}")


