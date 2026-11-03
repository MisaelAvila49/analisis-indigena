"""Extrae las muestras de análisis del inventario desde los dos proyectos que ya
las calculan (grupos-originarios y perdida-lengua) y las escribe en una sola
forma tabular en src/data/muestras/.

No recalcula nada desde microdatos: suma numerador y denominador de las
celdas ya publicadas en esos sitios (nunca promedia tasas). La forma común es
la que se propone para IberoData (ver docs/esquema.md):

    fuente, edicion, nivel, cve, nombre, indicador, criterio, grupo,
    sexo, edad, corte, num, den, ee, casos

Cada archivo trae solo las columnas que usa; los nombres no cambian.

Uso:  python scripts/extraer_muestras.py
"""
from pathlib import Path

import duckdb

RAIZ = Path(__file__).resolve().parents[1]
FRAMEWORK = RAIZ.parent
G = (FRAMEWORK / "grupos-originarios" / "src" / "data").as_posix()
P = (FRAMEWORK / "perdida-lengua" / "src" / "data").as_posix()
SALIDA = RAIZ / "src" / "data" / "muestras"
SALIDA.mkdir(parents=True, exist_ok=True)

con = duckdb.connect()

# Error estándar de una suma de celdas independientes: raíz de la suma de
# (ee * den)^2 entre el denominador sumado. Aproximación: ignora la
# covarianza entre celdas del mismo diseño muestral.
EE_SUMA = "sqrt(sum(power(coalesce(ee, 0) * den, 2))) / nullif(sum(den), 0)"


def escribir(nombre, sql):
    destino = SALIDA / f"{nombre}.csv"
    con.sql(f"copy ({sql}) to '{destino.as_posix()}' (header, delimiter ',')")
    n = con.sql(f"select count(*) from read_csv('{destino.as_posix()}')").fetchone()[0]
    print(f"[ok] {nombre}.csv  {n:,} filas")


# --- Censo: serie de hablantes por entidad, solo ediciones censales ----------
escribir("censo_serie", f"""
  select 'censo' as fuente, m.anio as edicion, m.nivel, m.cve,
         coalesce(e.nombre, 'Todo el país') as nombre,
         'Habla lengua indígena (5 años y más)' as indicador,
         m.num, m.den, m.ee
  from '{P}/municipal.parquet' m
  left join (select distinct cve, nombre from '{G}/mapa_nacional_2020.parquet' where nivel = 'entidad') e
    on m.cve = e.cve
  where m.fuente = 'censo' and m.nivel in ('nacional', 'entidad')
  order by m.nivel, m.cve, m.anio
""")

# --- Censo 2020: cinco criterios de población indígena por entidad ------------
escribir("censo2020_entidad", f"""
  select 'censo' as fuente, 2020 as edicion, nivel, cve,
         case when nivel = 'nacional' then 'Todo el país' else nombre end as nombre,
         poblacion as criterio, sexo, edad, num, den, ee, cota
  from '{G}/mapa_nacional_2020.parquet'
  where nivel in ('nacional', 'entidad')
  order by criterio, sexo, edad, cve
""")

# --- Encuesta Intercensal: habla y se considera, por entidad -----------------
escribir("eic_identidad", f"""
  select 'conteos-eic' as fuente, i.anio as edicion, i.nivel, i.cve,
         coalesce(e.nombre, 'Todo el país') as nombre,
         i.indicador as criterio, i.num, i.den, i.ee, i.casos
  from '{P}/identidad_mun.parquet' i
  left join (select distinct cve, nombre from '{G}/mapa_nacional_2020.parquet' where nivel = 'entidad') e
    on i.cve = e.cve
  where i.fuente = 'intercensal' and i.nivel in ('nacional', 'entidad')
  order by edicion, criterio, cve
""")

# --- Serie nacional de los conteos y encuestas intercensales ------------------
escribir("eic_serie", f"""
  select fuente, anio as edicion, num, den, ee
  from '{P}/municipal.parquet'
  where nivel = 'nacional'
  order by anio
""")


def por_criterio(archivo, columnas, filtro="true"):
    """Pasa las celdas de grupos-originarios (lengua Sí/No, autoads Sí/No) a la
    forma criterio + grupo, sumando sobre lo que no se pide en `columnas`.
    Agrega además el renglón «Total» de sexo."""
    cols = ", ".join(columnas)
    partes = []
    for criterio, col in (("lengua", "lengua"), ("autoads", "autoads")):
        grupo = f"case when {col} = 'Sí' then 'Población indígena' else 'Resto de la población' end"
        for sexo in ("sexo", "'Total'"):
            partes.append(f"""
              select anio as edicion, indicador, '{criterio}' as criterio, {grupo} as grupo,
                     {sexo} as sexo, {cols},
                     sum(num) as num, sum(den) as den, sum(casos) as casos, {EE_SUMA} as ee
              from '{archivo}'
              where {filtro}
              group by all""")
    return " union all ".join(partes)


# --- ENIGH: dispositivos y conexión del hogar por decil ----------------------
escribir("enigh_decil", f"""
  select 'enigh' as fuente, * from ({por_criterio(f'{G}/indicadores/enigh-hogar_decil.parquet', ['decil as corte'])})
  order by edicion, indicador, criterio, sexo, grupo, try_cast(corte as int)
""")

# --- ENDUTIH 2025: uso de tecnologías por grupo de edad ----------------------
IND_ENDUTIH = ["Usa internet", "Usa internet todos los días", "Usa celular", "El celular que usa es inteligente",
               "Usa computadora, laptop o tableta", "Vive en un hogar con internet", "Usa internet en el hogar",
               "Se conecta con datos móviles"]
lista = ", ".join("'" + i.replace("'", "''") + "'" for i in IND_ENDUTIH)
escribir("endutih_edad", f"""
  with base as ({por_criterio(f'{G}/indicadores/endutih-uso.parquet', ['rango_edad as edad'], f'indicador in ({lista})')}),
  todas as (
    select edicion, indicador, criterio, grupo, sexo, 'Todas' as edad,
           sum(num) as num, sum(den) as den, sum(casos) as casos, {EE_SUMA} as ee
    from base group by all)
  select 'endutih' as fuente, * from (select * from base union all select * from todas)
  order by indicador, criterio, sexo, grupo, edad
""")

# --- ENADIS: discriminación y sus motivos ------------------------------------
escribir("enadis", f"""
  select 'enadis' as fuente, anio as edicion, indicador, categoria, sexo, edad,
         ambito as corte, num, den, ee, casos
  from read_csv('{G}/enadis.csv')
  where indicador in ('discriminacion', 'motivo', 'derecho_alguno')
  order by edicion, indicador, categoria
""")

# --- ENDIREH 2021: violencia contra las mujeres ------------------------------
escribir("endireh", f"""
  select 'endireh' as fuente, anio as edicion, ambito_geo as nombre, criterio,
         case grupo when 'Indígena' then 'Población indígena' when 'Resto' then 'Resto de la población' else 'Todas las mujeres' end as grupo,
         edad, indicador, periodo as corte, num, den, ee, casos
  from read_csv('{G}/endireh.csv')
  order by nombre, criterio, corte, indicador
""")

# --- CONEVAL: pobreza y carencias por grupo ----------------------------------
escribir("coneval", f"""
  select 'coneval' as fuente, anio as edicion, criterio,
         case grupo when 'Indígena' then 'Población indígena' else 'Resto de la población' end as grupo,
         sexo, bloque as corte, indicador, pct, millones
  from read_csv('{G}/coneval_pobreza.csv')
  order by criterio, sexo, indicador, grupo, edicion
""")

# --- CONAPO 2020: grado de marginación urbana de las AGEB de la CDMX ----------
escribir("conapo_ageb", f"""
  select 'conapo' as fuente, 2020 as edicion, alcaldia as nombre, coalesce(gm_conapo, 'Sin grado') as corte,
         count(*) as agebs, sum(POBTOT) as pobtot, sum(P3YM_HLI) as hli, sum(PHOG_IND) as hogares
  from read_csv('{G}/agebs_resumen.csv')
  group by all order by nombre, corte
""")

# --- INPI 2020: tipología de municipios --------------------------------------
escribir("inpi_municipios", f"""
  with mun as (
    select substr(lpad(cast(cve as varchar), 5, '0'), 1, 2) as cve_ent, tipo, num
    from read_csv('{G}/inpi_2020.csv', all_varchar = true)
    where nivel = 'municipio'),
  ent as (select lpad(cast(cve as varchar), 2, '0') as cve_ent, nombre
          from read_csv('{G}/inpi_2020.csv', all_varchar = true) where nivel = 'entidad')
  select 'inpi' as fuente, 2020 as edicion, mun.cve_ent as cve, ent.nombre, mun.tipo as corte,
         count(*) as municipios, sum(cast(mun.num as double)) as num
  from mun join ent using (cve_ent)
  group by all order by cve, corte
""")

# --- INALI 2012: grado de riesgo de cada variante ----------------------------
escribir("inali_riesgo", f"""
  select 'inali' as fuente, 2012 as edicion, familia, agrupacion, variante, grado as corte
  from read_csv('{G}/inali_riesgo_2012.csv')
  order by familia, agrupacion, variante
""")
