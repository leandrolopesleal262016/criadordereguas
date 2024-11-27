import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { clamp } from 'lodash';
import jsPDF from 'jspdf';

const RulerGenerator = () => {
  const [unit, setUnit] = useState('cm');
  const [length, setLength] = useState(30);
  const [widthCm, setWidthCm] = useState(2);
  const [rulerName, setRulerName] = useState('');
  
  const cmToPixels = (cm) => cm * 37.7952755906;
  const width = cmToPixels(widthCm);

  const getTotalLength = () => {
    switch (unit) {
      case 'mm':
        return cmToPixels(length / 10);
      case 'pol':
        return width * length;
      case 'cm':
      default:
        return width * length;
    }
  };

  const generateMarks = () => {
    const marks = [];
    const mainDivisions = unit === 'pol' ? 16 : 10;
    const totalDivisions = unit === 'mm' ? length : length * mainDivisions;
    const totalLength = getTotalLength();
    const step = totalLength / (unit === 'mm' ? length : length * mainDivisions);
    
    for (let i = 0; i <= totalDivisions; i++) {
      const position = i * step;
      const isMajor = unit === 'mm' ?
                     (i % 5 === 0) :
                     (i % mainDivisions === 0);
      const isMedium = !isMajor && (unit === 'mm' ? false : i % (mainDivisions / 2) === 0);
      const lineHeight = isMajor ? width / 3 : isMedium ? width / 4 : width / 6;
      
      if (position <= totalLength) {
        marks.push(
          <line
            key={`line-${i}`}
            x1={position}
            y1={0}
            x2={position}
            y2={lineHeight}
            stroke="black"
            strokeWidth={unit === 'mm' ? (isMajor ? "1" : "0.5") : "1"}
          />
        );
        
        if (isMajor && (unit === 'mm' ? i % 5 === 0 : true)) {
          const fontSize = unit === 'mm' ? width / 12 : width / 10;
          const value = unit === 'cm' ? i / mainDivisions : i;
          
          const textX = i === totalDivisions ? position - 4 : position + 2;
          const textAnchorValue = i === totalDivisions ? "end" : "start";
          
          marks.push(
            <text
              key={`text-${i}`}
              x={textX}
              y={width / 2.5}
              textAnchor={textAnchorValue}
              fontSize={fontSize}
            >
              {value}
            </text>
          );
        }
      }
    }
    return marks;
  };

  const downloadSVG = () => {
    try {
      const svgData = document.getElementById('ruler')?.outerHTML;
      if (!svgData) return;
      
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `regua_${rulerName || 'personalizada'}_${length}${unit}.svg`;
      
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar SVG:', error);
    }
  };

  const downloadPDF = () => {
    try {
      const totalLength = getTotalLength();
      const doc = new jsPDF({
        orientation: totalLength > width ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [totalLength, width]
      });
      
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, totalLength, width, 'F');
      
      doc.setDrawColor(0, 0, 0);
      doc.rect(0, 0, totalLength, width);
      
      const mainDivisions = unit === 'pol' ? 16 : 10;
      const totalDivisions = unit === 'mm' ? length : length * mainDivisions;
      const step = totalLength / totalDivisions;
      
      for (let i = 0; i <= totalDivisions; i++) {
        const position = i * step;
        const isMajor = unit === 'mm' ? (i % 5 === 0) : i % mainDivisions === 0;
        const isMedium = !isMajor && (unit === 'mm' ? false : i % (mainDivisions / 2) === 0);
        const lineHeight = isMajor ? width / 3 : isMedium ? width / 4 : width / 6;
        
        if (position <= totalLength) {
          doc.line(position, 0, position, lineHeight);
          
          if (isMajor && (unit === 'mm' ? i % 5 === 0 : true)) {
            const fontSize = unit === 'mm' ? width / 12 : width / 10;
            const value = unit === 'cm' ? i / mainDivisions : i;
            doc.setFontSize(fontSize);
            doc.text(String(value),
                    i === totalDivisions ? position - 4 : position + 2,
                    width / 2.5,
                    { align: i === totalDivisions ? 'right' : 'left' });
          }
        }
      }
      
      if (rulerName) {
        doc.setFontSize(width / 6);
        doc.setFont('helvetica', 'bold');
        doc.text(rulerName, totalLength / 2, width * 0.75, { align: 'center' });
      }
      
      const fileName = `regua_${rulerName || 'personalizada'}_${length}${unit}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-6xl mx-auto bg-gray-800 rounded-lg border border-gray-700 shadow-xl">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Gerador de Réguas Wise360</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Nome da Régua</label>
              <input
                type="text"
                value={rulerName}
                onChange={(e) => setRulerName(e.target.value)}
                placeholder="Digite um nome personalizado"
                maxLength={30}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Unidade</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cm">Centímetros (cm)</option>
                <option value="mm">Milímetros (mm)</option>
                <option value="pol">Polegadas (pol)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Comprimento ({unit})</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(clamp(Number(e.target.value), 1, 100))}
                min="1"
                max="100"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Largura</label>
              <select
                value={widthCm}
                onChange={(e) => setWidthCm(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2">2 cm</option>
                <option value="3">3 cm</option>
                <option value="4">4 cm</option>
              </select>
            </div>
          </div>

          <div className="border border-gray-600 p-4 rounded-lg overflow-x-auto bg-white">
            <svg
              id="ruler"
              viewBox={`0 0 ${getTotalLength()} ${width}`}
              className="w-full"
            >
              <rect
                x="0"
                y="0"
                width={getTotalLength()}
                height={width}
                fill="white"
                stroke="black"
              />
              {generateMarks()}
              {rulerName && (
                <text
                  x={getTotalLength() / 2}
                  y={width * 0.75}
                  textAnchor="middle"
                  fontSize={width / 6}
                  fontWeight="bold"
                >
                  {rulerName}
                </text>
              )}
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={downloadSVG}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar SVG
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulerGenerator;