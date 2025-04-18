import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configurer le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Déterminer le dossier de destination en fonction du type de fichier
    let uploadPath = 'uploads/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    }
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Filtrer les types de fichiers autorisés
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Autoriser uniquement les images et vidéos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non pris en charge. Uniquement les images et vidéos sont autorisées.'));
  }
};

// Limite de taille des fichiers (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024 // 10MB
};

// Configurer l'uploader
export const upload = multer({ 
  storage,
  fileFilter,
  limits
});

// Gestionnaire de route pour l'upload de fichiers
export const handleFileUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
    }
    
    // Construire l'URL du fichier téléchargé
    const protocol = req.protocol;
    const host = req.get('host');
    const filePath = req.file.path.replace(/\\/g, '/'); // Normaliser le chemin pour les URL
    const fileUrl = `${protocol}://${host}/${filePath}`;
    
    return res.status(200).json({
      success: true,
      fileUrl,
      fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
};