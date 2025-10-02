import pytesseract
from PIL import Image
import cv2
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import functools
import os

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def load_and_validate_image(image_path):
    flag = True
    
    if not image_path or not os.path.isfile(image_path):
        print("Неверный путь к изображению")
        flag = False
    
    img = cv2.imread(image_path)
    if img is None:
        print("Не удалось загрузить изображение")
        flag = False
    
    print(f"Изображение загружено: {img.shape}")
    if flag == True:
        return img
    else:
        return None

def table_detection(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    binary = cv2.adaptiveThreshold(enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                  cv2.THRESH_BINARY_INV, 11, 2)
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
    horizontal_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
    vertical_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
    table_structure = cv2.bitwise_or(horizontal_lines, vertical_lines)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    table_structure = cv2.dilate(table_structure, kernel, iterations=1)
    table_structure = cv2.morphologyEx(table_structure, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    return table_structure, horizontal_lines, vertical_lines

def find_table_cells(table_structure):
    contours, hierarchy = cv2.findContours(
        table_structure, 
        cv2.RETR_CCOMP,  
        cv2.CHAIN_APPROX_SIMPLE
    )
    cell_contours = []
    min_area = 100
    max_area = image.shape[0] * image.shape[1] * 0.8 
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < min_area or area > max_area:
            continue
        
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            continue
            
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approx) >= 4: 
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / h
            
            if 0.1 < aspect_ratio < 10:
                cell_contours.append(contour)
    
    return cell_contours

def alternative_cell_detection(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    binary2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY_INV, 11, 2)
    
    binary = cv2.bitwise_or(binary1, binary2)
    
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 1))
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 20))
    
    horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_h)
    vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_v)
    
    table_mask = cv2.bitwise_or(horizontal, vertical)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    table_mask = cv2.morphologyEx(table_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    return table_mask

def sort_contours_to_grid(bounding_boxes, expected_rows=11, expected_cols=12, y_tolerance=15):
    if not bounding_boxes:
        return []
    
    bounding_boxes.sort(key=lambda b: b[1])
    
    rows_list = []
    current_row = [bounding_boxes[0]]
    current_y = bounding_boxes[0][1]
    
    for bbox in bounding_boxes[1:]:
        if abs(bbox[1] - current_y) <= y_tolerance:
            current_row.append(bbox)
        else:
            current_row.sort(key=lambda b: b[0])
            rows_list.append(current_row)
            current_row = [bbox]
            current_y = bbox[1]
    
    if current_row:
        current_row.sort(key=lambda b: b[0])
        rows_list.append(current_row)
    
    print(f"Найдено строк: {len(rows_list)}, ожидалось: {expected_rows}")
    
    for i, row in enumerate(rows_list):
        print(f"Строка {i}: {len(row)} ячеек")
    
    return rows_list

def create_table_dictionary(columns=12, rows=11, true_columns=[4,5,6,7,10,11], start_row=1):
    document_dict = {}
    
    for row in range(1, rows + 1):
        for col in range(1, columns + 1):
            key = f"c{col}_r{row}"
            if col in true_columns and row >= start_row:
                document_dict[key] = True
            else:
                document_dict[key] = False
    
    return document_dict

def map_grid_to_dictionary(grid, document_dict, data_start_row=0):
    true_cells = []
    
    print(f"Сетка: {len(grid)} строк, словарь: {len(document_dict)} ячеек")
    
    dict_keys = list(document_dict.keys())
    key_index = 0
    
    for grid_row_idx in range(data_start_row, len(grid)):
        row_cells = grid[grid_row_idx]
        
        for grid_col_idx in range(len(row_cells)):
            if key_index >= len(dict_keys):
                break
                
            current_key = dict_keys[key_index]
            
            if document_dict[current_key]:
                x, y, w, h = row_cells[grid_col_idx]
                true_cells.append({
                    'key': current_key,
                    'bbox': (x, y, w, h),
                    'grid_pos': (grid_row_idx, grid_col_idx)
                })
                print(f"Сопоставлено: {current_key} -> строка {grid_row_idx}, колонка {grid_col_idx}")
            
            key_index += 1
    
    return true_cells

def extract_cells_from_image(image, true_cells):
    extracted_cells = []
    
    for cell_info in true_cells:
        x, y, w, h = cell_info['bbox']
        cell_image = image[y:y+h, x:x+w]
        
        extracted_cells.append({
            'key': cell_info['key'],
            'bbox': cell_info['bbox'],
            'image': cell_image,
            'grid_pos': cell_info['grid_pos']
        })
    
    return extracted_cells

if __name__ == '__main__':
    image_path = "TTN_2.jpg"
    image = load_and_validate_image(image_path)

    if image is not None:
        table_structure, horizontal, vertical = table_detection(image)
        cell_contours1 = find_table_cells(table_structure)
    
        table_mask2 = alternative_cell_detection(image)
        cell_contours2 = find_table_cells(table_mask2)
    
        if len(cell_contours1) > len(cell_contours2):
            cell_contours = cell_contours1
            method_used = "Улучшенная детекция"
            table_vis = table_structure
        else:
            cell_contours = cell_contours2
            method_used = "Альтернативная детекция"
            table_vis = table_mask2
    
        bounding_boxes = [cv2.boundingRect(c) for c in cell_contours]
        grid = sort_contours_to_grid(bounding_boxes, expected_rows=11, expected_cols=12)
        data_start_row = 2  
        document_dict = create_table_dictionary(columns=12, rows=11, true_columns=[4,5,6,7,10,11], start_row=1)
        true_cells_info = map_grid_to_dictionary(grid, document_dict, data_start_row)
        extracted_cells = extract_cells_from_image(image, true_cells_info)
        result_image = image.copy()
    
        for row in grid:
            for bbox in row:
                x, y, w, h = bbox
                cv2.rectangle(result_image, (x, y), (x+w, y+h), (0, 255, 0), 1)
    
        for cell in extracted_cells:
            x, y, w, h = cell['bbox']
            cv2.rectangle(result_image, (x, y), (x+w, y+h), (0, 0, 255), 3)
        
            cell_key = cell['key']
            cv2.putText(result_image, cell_key, (x, y-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    
        plt.figure(figsize=(16, 12))
        plt.imshow(cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB))
        plt.title(f'Результат: {len(extracted_cells)} ячеек с True (красные)')
        plt.axis('off')
        plt.tight_layout()
        plt.show()