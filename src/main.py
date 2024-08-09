from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


app = FastAPI()


app.mount('/static', StaticFiles(directory='static'), name='static')

templates = Jinja2Templates(directory='templates')


# Оотображает раздел с информацией о компании
@app.get('/', response_class=HTMLResponse)
async def get_company_about(request: Request):
    return templates.TemplateResponse(request=request, name='company-about.html')


# Отображает раздел с информацией о сотрудничестве с компанией
@app.get('/company-cooperation', response_class=HTMLResponse)
async def get_company_cooperation(request: Request):
    return templates.TemplateResponse(request=request, name='company-cooperation.html')


# Отображает раздел с часто задаваемыми вопросами и ответами на них
@app.get('/user-help', response_class=HTMLResponse)
async def get_user_help(request: Request):
    return templates.TemplateResponse(request=request, name='user-help-get.html')


# Отображает раздел аннотации фото (заглушка)
@app.get('/video/annotation-photo', response_class=HTMLResponse)
async def get_photo_annotation(request: Request):
    return templates.TemplateResponse(request=request, name='annotation-photo.html')


# Отображает раздел с аннотацией видео
@app.get('/video/annotation-video', response_class=HTMLResponse)
async def get_video_annotation(request: Request):
    return templates.TemplateResponse(request=request, name='annotation-video.html')
