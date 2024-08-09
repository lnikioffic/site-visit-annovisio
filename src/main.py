from fastapi import FastAPI, Request, requests
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx


app = FastAPI()


app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


# Оотображает раздел с информацией о компании
@app.get("/", response_class=HTMLResponse)
async def get_company_about(request: Request):
    return templates.TemplateResponse(request=request, name="company-about.html")


# Отображает раздел с информацией о сотрудничестве с компанией
@app.get("/company-cooperation", response_class=HTMLResponse)
async def get_company_cooperation(request: Request):
    return templates.TemplateResponse(request=request, name="company-cooperation.html")


# Отображает раздел с аннотацией видео
@app.get("/video/annotation-video", response_class=HTMLResponse)
async def get_video_annotation(request: Request):
    return templates.TemplateResponse(request=request, name="annotation-video.html")


@app.get("/get_markdown")
async def get_markdown():
    markdown_url = (
        "https://raw.githubusercontent.com/lnikioffic/VisionDataForge/master/README.md"
    )
    async with httpx.AsyncClient() as client:
        response = await client.get(markdown_url)
        if response.status_code == 200:
            return {"content": response.text}
        else:
            return {"error": "Failed to fetch markdown file"}, 500
