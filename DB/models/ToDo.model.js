import mongoose, { Schema, Types, model } from "mongoose";

// 🔹 Document Sub-schema
const documentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  files: [
    {
      secure_url: {
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      resource_type: {
        type: String,
        required: true,
        enum: ["image", "raw"], // optional but safe
      },
    },
  ]
});

//tasks
const toDoSchema = new Schema(
  {
    customId:String,
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    taskCode: {
      type: String,
      unique: true,
    },
    taskName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Not Started", "To Do", "Completed"],
      default: "Not Started",
    },
    taskDetails: {
      type: String,
    },
    comment: {
      type: String,
    },
    // 🔹 Documents
    documents: [documentSchema],
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
toDoSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastTask = await mongoose.models.ToDo.findOne().sort({
      createdAt: -1,
    });

    let newCode = "0001";

    if (lastTask?.taskCode) {
      const lastNumber = parseInt(lastTask.taskCode, 10);
      newCode = (lastNumber + 1)
        .toString()
        .padStart(Math.max(4, (lastNumber + 1).toString().length), "0");
    }

    this.taskCode = newCode;
  }

  next();
});

const toDoModel = mongoose.models.ToDo || model("ToDo", toDoSchema);
export default toDoModel;
