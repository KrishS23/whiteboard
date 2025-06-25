const CanvasDatabaseModel = require("../models/canvasModel");
const UserDatabaseModel = require("../models/userModel");
const mongooseDatabase = require("mongoose");

exports.handleCanvasCreation = async (requestData, responseData) => {
    try {
        const authenticatedUserId = requestData.userId;

        const freshCanvasDocument = new CanvasDatabaseModel({
            owner: authenticatedUserId,
            shared: [],
            elements: []
        });

        await freshCanvasDocument.save();
        
        responseData.status(201).json({ 
            message: "Canvas created successfully", 
            canvasId: freshCanvasDocument._id 
        });
        
    } catch (canvasCreationError) {
        responseData.status(500).json({ 
            error: "Failed to create canvas", 
            details: canvasCreationError.message 
        });
    }
};

exports.handleCanvasUpdate = async (requestData, responseData) => {
    try {
        const { canvasId, elements } = requestData.body;
        const authenticatedUserId = requestData.userId;
        
        console.log("canvas id ", canvasId);

        const existingCanvasDocument = await CanvasDatabaseModel.findById(canvasId);
        if (!existingCanvasDocument) {
            return responseData.status(404).json({ error: "Canvas not found" });
        }

        const userIsOwner = existingCanvasDocument.owner.toString() === authenticatedUserId;
        const userHasSharedAccess = existingCanvasDocument.shared.includes(authenticatedUserId);
        
        if (!userIsOwner && !userHasSharedAccess) {
            return responseData.status(403).json({ error: "Unauthorized to update this canvas" });
        }

        existingCanvasDocument.elements = elements;
        await existingCanvasDocument.save();

        console.log("saved");

        responseData.json({ message: "Canvas updated successfully" });
        
    } catch (canvasUpdateError) {
        responseData.status(500).json({ 
            error: "Failed to update canvas", 
            details: canvasUpdateError.message 
        });
    }
};

exports.handleCanvasLoad = async (requestData, responseData) => {
    try {
        const requestedCanvasId = requestData.params.id;
        const authenticatedUserId = requestData.userId;

        const requestedCanvasDocument = await CanvasDatabaseModel.findById(requestedCanvasId);
        if (!requestedCanvasDocument) {
            return responseData.status(404).json({ error: "Canvas not found" });
        }

        const userIsOwner = requestedCanvasDocument.owner.toString() === authenticatedUserId;
        const userHasSharedAccess = requestedCanvasDocument.shared.includes(authenticatedUserId);
        
        if (!userIsOwner && !userHasSharedAccess) {
            return responseData.status(403).json({ error: "Unauthorized to access this canvas" });
        }

        responseData.json(requestedCanvasDocument);
        
    } catch (canvasLoadError) {
        responseData.status(500).json({ 
            error: "Failed to load canvas", 
            details: canvasLoadError.message 
        });
    }
};

exports.handleCanvasShare = async (requestData, responseData) => {
    try {
        const { email } = requestData.body;
        const targetCanvasId = requestData.params.id;
        const authenticatedUserId = requestData.userId;

        const userToShareWith = await UserDatabaseModel.findOne({ email });
        if (!userToShareWith) {
            return responseData.status(404).json({ error: "User with this email not found" });
        }

        const canvasToShare = await CanvasDatabaseModel.findById(targetCanvasId);
        if (!canvasToShare) {
            return responseData.status(404).json({ error: "Canvas not found" });
        }

        if (canvasToShare.owner.toString() !== authenticatedUserId) {
            return responseData.status(403).json({ error: "Only the owner can share this canvas" });
        }

        const sharedUserObjectId = new mongooseDatabase.Types.ObjectId(userToShareWith._id);

        if (canvasToShare.owner.toString() === sharedUserObjectId.toString()) {
            return responseData.status(400).json({ error: "Owner cannot be added to shared list" });
        }

        const userAlreadyHasAccess = canvasToShare.shared.some(id => id.toString() === sharedUserObjectId.toString());
        if (userAlreadyHasAccess) {
            return responseData.status(400).json({ error: "Already shared with user" });
        }

        canvasToShare.shared.push(sharedUserObjectId);
        await canvasToShare.save();

        responseData.json({ message: "Canvas shared successfully" });
        
    } catch (canvasShareError) {
        responseData.status(500).json({ 
            error: "Failed to share canvas", 
            details: canvasShareError.message 
        });
    }
};

exports.handleCanvasUnshare = async (requestData, responseData) => {
    try {
        const { userIdToRemove } = requestData.body;
        const targetCanvasId = requestData.params.id;
        const authenticatedUserId = requestData.userId;

        const canvasToUnshare = await CanvasDatabaseModel.findById(targetCanvasId);
        if (!canvasToUnshare) {
            return responseData.status(404).json({ error: "Canvas not found" });
        }

        if (canvasToUnshare.owner.toString() !== authenticatedUserId) {
            return responseData.status(403).json({ error: "Only the owner can unshare this canvas" });
        }

        canvasToUnshare.shared = canvasToUnshare.shared.filter(id => id.toString() !== userIdToRemove);
        await canvasToUnshare.save();

        responseData.json({ message: "Canvas unshared successfully" });
        
    } catch (canvasUnshareError) {
        responseData.status(500).json({ 
            error: "Failed to unshare canvas", 
            details: canvasUnshareError.message 
        });
    }
};

exports.handleCanvasDeletion = async (requestData, responseData) => {
    try {
        const canvasIdToDelete = requestData.params.id;
        const authenticatedUserId = requestData.userId;

        const canvasToDelete = await CanvasDatabaseModel.findById(canvasIdToDelete);
        if (!canvasToDelete) {
            return responseData.status(404).json({ error: "Canvas not found" });
        }

        if (canvasToDelete.owner.toString() !== authenticatedUserId) {
            return responseData.status(403).json({ error: "Only the owner can delete this canvas" });
        }

        await CanvasDatabaseModel.findByIdAndDelete(canvasIdToDelete);
        
        responseData.json({ message: "Canvas deleted successfully" });
        
    } catch (canvasDeletionError) {
        responseData.status(500).json({ 
            error: "Failed to delete canvas", 
            details: canvasDeletionError.message 
        });
    }
};

exports.handleGetUserCanvases = async (requestData, responseData) => {
    try {
        const authenticatedUserId = requestData.userId;

        const userAccessibleCanvases = await CanvasDatabaseModel.find({
            $or: [
                { owner: authenticatedUserId }, 
                { shared: authenticatedUserId }
            ]
        }).sort({ createdAt: -1 });

        responseData.json(userAccessibleCanvases);
        
    } catch (getUserCanvasesError) {
        responseData.status(500).json({ 
            error: "Failed to fetch canvases", 
            details: getUserCanvasesError.message 
        });
    }
};