import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, X } from 'lucide-react';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'color': [] }, { 'background': [] }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'color', 'background',
  'link'
];

export default function ClientNotesEditor({ value, onSave, onCancel, readOnly = false }) {
  const [notes, setNotes] = useState(value || '');

  const handleSave = () => {
    onSave(notes);
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <ReactQuill
            theme="snow"
            value={notes}
            onChange={setNotes}
            modules={readOnly ? { toolbar: false } : modules}
            formats={formats}
            readOnly={readOnly}
            className={readOnly ? 'read-only-quill' : ''}
            placeholder="Adicione observações sobre o cliente..."
          />
        </div>
        
        {!readOnly && (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .read-only-quill .ql-container {
          border: none;
        }
        .read-only-quill .ql-editor {
          padding: 0;
        }
      `}</style>
    </Card>
  );
}