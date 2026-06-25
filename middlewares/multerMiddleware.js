import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter =(req,file, cb)=>{
const allowed =['image/jpeg', 'image/png', 'image/webp'];
if(allowed.includes(file.mimetype)) {
    cb(null, true);
}else{
    cb(new Error('only Jpeg, png and webp images are allowed'), false);
}
};

const upload =multer({
    storage,
    fileFilter,
    limits:{fileSize: 5 * 1024 * 1024}
});

export const uploadProductImages = upload.array('images', 20)