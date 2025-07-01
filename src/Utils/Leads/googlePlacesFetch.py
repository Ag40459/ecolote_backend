import requests
import pandas as pd
import time
from datetime import datetime
import json
import sys
import argparse
from dotenv import load_dotenv
import os
import psycopg2
from psycopg2 import Error

load_dotenv()
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

PGHOST = os.getenv("PGHOST")
PGPORT = os.getenv("PGPORT")
PGDATABASE = os.getenv("PGDATABASE")
PGUSER = os.getenv("PGUSER")
PGPASSWORD = os.getenv("PGPASSWORD")

if not API_KEY:
    raise EnvironmentError("API_KEY não encontrada no .env")

if not all([PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD]):
    raise EnvironmentError("Credenciais do PostgreSQL não encontradas no .env")

LIMITE_REQUISICOES = 900 


contador_requisicoes = 0

def checar_limite():
    global contador_requisicoes
    if contador_requisicoes >= LIMITE_REQUISICOES:
        return True
    return False

def extrair_bairro(endereco):
    try:
        partes = endereco.split(",")
        if len(partes) >= 2:
            pos_virgula = partes[1]
            subpartes = pos_virgula.split("-")
            if len(subpartes) >= 2:
                bairro = subpartes[-1].strip()
                return bairro
        return ""
    except Exception as e:
        print(f"Erro ao extrair bairro: {e}", file=sys.stderr)
        return ""

def buscar_detalhes(place_id):
    global contador_requisicoes
    if checar_limite():
        print("🚫 Limite de requisições atingido.", file=sys.stderr)
        return {}
    
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,formatted_phone_number,geometry/location,photos",
        "key": API_KEY
    }
    try:
        res = requests.get(url, params=params)
        res.raise_for_status()
        contador_requisicoes += 1
        return res.json().get("result", {})
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Erro ao buscar detalhes para {place_id}: {e}", file=sys.stderr)
        return {}

def get_existing_place_ids():
    existing_place_ids = set()
    conn = None
    try:
        conn = psycopg2.connect(host=PGHOST, port=PGPORT, database=PGDATABASE, user=PGUSER, password=PGPASSWORD)
        cur = conn.cursor()
        cur.execute("SELECT place_id FROM leads")
        for row in cur.fetchall():
            existing_place_ids.add(row[0])
        cur.close()
    except (Exception, Error) as error:
        print(f"Erro ao conectar ou consultar o PostgreSQL: {error}", file=sys.stderr)
    finally:
        if conn:
            conn.close()
    return existing_place_ids

def insert_lead_to_db(lead_data):
    conn = None
    try:
        conn = psycopg2.connect(host=PGHOST, port=PGPORT, database=PGDATABASE, user=PGUSER, password=PGPASSWORD)
        cur = conn.cursor()
        cur.execute("""
    INSERT INTO leads (
        place_id, name, formatted_address, city, state, neighborhood,
        formatted_phone_number, latitude, longitude, image_urls,
        type, collected_at, status, last_status_update_at
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
    ON CONFLICT (place_id) DO NOTHING
""", (
    lead_data["place_id"],
    lead_data["name"],
    lead_data["formatted_address"],
    lead_data["city"],
    lead_data["state"],
    lead_data["neighborhood"],
    lead_data["formatted_phone_number"],
    lead_data["coordinates"]["lat"],
    lead_data["coordinates"]["lng"],
    lead_data["image_urls"],
    lead_data["type"],
    lead_data["collection_date"],
    "Disponível"
))

        conn.commit()
        cur.close()
        return True
    except (Exception, Error) as error:
        print(f"Erro ao inserir lead no PostgreSQL: {error}", file=sys.stderr)
        return False
    finally:
        if conn:
            conn.close()

def buscar_lugares(cidade, estado, termos, salvar_com_telefone, salvar_sem_telefone, bairro_filtro=None):
    global contador_requisicoes
    
    existing_place_ids = get_existing_place_ids()
    print(f"\n{len(existing_place_ids)} leads existentes carregados do Seu Banco de Dados.", file=sys.stderr)

    all_collected_leads = []
    new_leads_count = 0
    leads_with_phone = 0
    leads_without_phone = 0

    for termo in termos:
        query = f"{termo} em {cidade}, {estado}"
        if bairro_filtro:
            query = f"{termo} em {bairro_filtro}, {cidade}, {estado}"

        url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            "query": query,
            "key": API_KEY
        }
        pagetoken = None

        for _ in range(3):
            if checar_limite():
                break
            
            if pagetoken:
                params = {"pagetoken": pagetoken, "key": API_KEY}
                time.sleep(2)

            try:
                res = requests.get(url, params=params)
                res.raise_for_status()
                data = res.json()
                contador_requisicoes += 1
            except requests.exceptions.RequestException as e:
                print(f"⚠️ Erro na busca \'{query}\': {e}", file=sys.stderr)
                break

            for place in data.get("results", []):
                if checar_limite():
                    break

                place_id = place["place_id"]
                
                if place_id in existing_place_ids:
                    continue

                detalhes = buscar_detalhes(place_id)
                nome = detalhes.get("name")
                
                if not nome or termo.lower() not in nome.lower():
                    continue

                telefone = detalhes.get("formatted_phone_number")
                endereco = detalhes.get("formatted_address")
                bairro = extrair_bairro(endereco) if endereco else ""
                data_coleta = datetime.now().isoformat()
                
                coordenadas = {"lat": None, "lng": None}
                if "geometry" in detalhes and "location" in detalhes["geometry"]:
                    lat = detalhes["geometry"]["location"].get("lat")
                    lng = detalhes["geometry"]["location"].get("lng")
                    if lat is not None and lng is not None:
                        coordenadas = {"lat": lat, "lng": lng}

                image_urls = []
                if "photos" in detalhes and detalhes["photos"]:
                    photo = detalhes["photos"][0]
                    photo_reference = photo.get("photo_reference")
                    if photo_reference: image_urls.append(
            f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photo_reference}&key={API_KEY}"
        )


                if (salvar_com_telefone and telefone) or \
                   (salvar_sem_telefone and not telefone) or \
                   (salvar_com_telefone and salvar_sem_telefone):
                    
                    lead_data = {
                        "place_id": place_id,
                        "name": nome,
                        "formatted_address": endereco,
                        "city": cidade,
                        "state": estado,
                        "neighborhood": bairro,
                        "formatted_phone_number": telefone,
                        "type": termo,
                        "collection_date": data_coleta,
                        "coordinates": coordenadas,
                        "image_urls": image_urls
                    }
                    
                    if insert_lead_to_db(lead_data):
                        all_collected_leads.append(lead_data)
                        new_leads_count += 1
                        if telefone:
                            leads_with_phone += 1
                        else:
                            leads_without_phone += 1

                time.sleep(1.5)

            pagetoken = data.get("next_page_token")
            if not pagetoken:
                break
    
    print(f"\n--- Resumo da Coleta ---", file=sys.stderr)
    print(f"Total de novos leads coletados e inseridos: {new_leads_count}", file=sys.stderr)
    print(f"Leads com telefone: {leads_with_phone}", file=sys.stderr)
    print(f"Leads sem telefone: {leads_without_phone}", file=sys.stderr)
    print(f"------------------------", file=sys.stderr)

    return all_collected_leads

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Busca de Leads em Google Places API.")
    parser.add_argument("--cidade", required=True, help="Cidade para a busca.")
    parser.add_argument("--estado", required=True, help="Estado (UF) para a busca.")
    parser.add_argument("--termos", nargs="+", default=["Condomínio","Hotel", "Edifício", "Prédio", "Residencial"], help="Termos de busca (ex: Condomínio, Hotel).")
    parser.add_argument("--bairro", help="Bairro opcional para filtrar a busca.")
    parser.add_argument("--com_telefone", action="store_true", help="Salvar leads com telefone.")
    parser.add_argument("--sem_telefone", action="store_true", help="Salvar leads sem telefone.")

    args = parser.parse_args()

    if not args.com_telefone and not args.sem_telefone:
        args.com_telefone = True
        args.sem_telefone = True

    print(f"Iniciando busca para {args.cidade}/{args.estado} com termos: {args.termos}", file=sys.stderr)

    collected_leads = buscar_lugares(
        cidade=args.cidade,
        estado=args.estado,
        termos=args.termos,
        salvar_com_telefone=args.com_telefone,
        salvar_sem_telefone=args.sem_telefone,
        bairro_filtro=args.bairro
    )

    print(json.dumps(collected_leads, ensure_ascii=False, indent=4))

    sys.exit(0)