import json
from js import window
from pyodide.ffi import to_js
from excel_analyzer import ExcelAnalyzer
from openpyxl.utils import column_index_from_string

def py_get_sheets(js_buffer):
    file_bytes = bytes(js_buffer.to_py())
    analyzer = ExcelAnalyzer(file_bytes)
    return to_js(analyzer.sheet_names)

def py_get_active_columns(js_buffer, sheet_name):
    file_bytes = bytes(js_buffer.to_py())
    analyzer = ExcelAnalyzer(file_bytes)
    return to_js(analyzer.get_active_columns(sheet_name))

def py_extract_mapped_data(js_buffer, mapping_str):
    file_bytes = bytes(js_buffer.to_py())
    analyzer = ExcelAnalyzer(file_bytes)
    loaded_data = json.loads(mapping_str)
    
    columns = {}
    for variable, mapping in loaded_data.items():
        if mapping:
            columns[variable] = analyzer.get_cell_values(
                sheet_name=mapping["sheet"],
                column_index=column_index_from_string(mapping["column"])
            )

    result = []
    if columns:
        row_count = min(len(values) for values in columns.values())
        for index in range(row_count):
            row = {variable: values[index] for variable, values in columns.items()}
            result.append(row)

    return to_js(result, dict_converter=window.Object.fromEntries)

window.py_get_sheets = py_get_sheets
window.py_get_active_columns = py_get_active_columns
window.py_extract_mapped_data = py_extract_mapped_data
window.pyScriptReady = True