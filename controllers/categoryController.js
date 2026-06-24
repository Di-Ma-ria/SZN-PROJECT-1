import {Category} from '../models/categoryModel.js';

//(ADMIN ONLY ) Create Category

export const createCategory = async (req, res, next) => {
  try{
    const { name, description, image, parent, isActive } = req.body;

//checking if name is not already taken

const existing = await Category.findOne({
  name: {$regex:`^${name}$`, $options: 'i' },
});
if(existing) {
  return res.status(409).json({
    success: false,
    message: 'A category with this name already exists'
  });
}


//validate parent exists if given

if(parent) {
  const parentExists = await Category.findById(parent);
  if(!parentExists) {
    return res.status(404).json({
      success: false,
      message: 'Parent category not found',
    });
  }
}

const category = await Category.create({
  name,
  description: description || null,
  image: image || null,
  parent: parent || null,
  isActive: isActive ??true,
});

return res.status(201).json({
  success: true,
  message: 'Category created successfully',
  category,
});
  } catch (error){
    next(error);
  }
};



//To get all Categories 

export const getAllCategories = async (req, res, next) => {
  try{
    const {search, parent, isActive } = req.query;

    const filter = { isDeleted: false };

    if(isActive !==undefined) filter.isActive = isActive === 'true';

    //pass parent = null to get tope-level categories only

    if(parent ==='null') {
      filter.parent = null;
    } else if(parent) {
      filter.parent = parent;
    }

    if(search) {
      filter.name = { $regex: search, $options: 'i'};
    }

    const categories = await Categories.find(filter)
    .populate('parent', 'name slug')
    .sort({ name: 1});

    return res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch(error){
    next(error);
  }
};


//get a single category

export const getSingleCategory = async (req, res, next) => {
  try{
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('parent', 'name slug');

    if(!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    return res.json({success: true, category });
  } catch(error){
    next (error);
  }
};


//(admin only)) can update category

export const updatedCategory = async (req, res, next) => {
  try{
    const { name, description, image, parent, isActive } = req.body;
    
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if(!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }


    //if renaming make sure new name isn't taken
    if(name && name !== category.name) {
      const existing = await Category.findOne({
        name: {$regex: `^${name}$`, $options: 'i' },
        _id: { $ne: req.params.id },
      });

      if(existing) {
        return res.status(409).json ({
          success: false,
          message: 'A category with this name already exists',
        });
      }
    }

    if(name  !== undefined) category.name = name;
    if(description  !== undefined) category.description = description;
    if(image  !== undefined) category.image   =image;
    if(parent   !==undefined)category.parent   =parent;
    if(isActive   !== undefined) category.isActive   = isActive;

    await category.save();

    return res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};



//Delete category (admin only)

export const deleteCategory = async (req, res, next ) => {
  try{
    const category = await Category.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if(!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    category.isDeleted = true;
    category.isActive = false;
    await category.save();

    return res.json({
      success: true, 
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};