import mongoose from 'mongoose';

const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&*@])[A-Za-z\d#\$%&*@]{8,}$/;
// Min 8, 1 mayúscula, 1 dígito, 1 especial de # $ % & * @

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },         // nuevo
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: true,
      validate: {
        validator: v => passwordRegex.test(v),
        message:
          'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 dígito y 1 caracter especial (# $ % & * @).'
      }
    },
    phoneNumber: { type: String, required: true, trim: true },          // nuevo
    birthdate: { type: Date, required: true },                           // nuevo
    url_profile: { type: String },                                       // nuevo
    adress: { type: String },        
    phoneNumber: { type: String, required: true, trim: true },
    birthdate: { type: Date, required: true },
    url_profile: { type: String, trim: true },
    adress: { type: String, trim: true },                                    // nuevo (sic del enunciado)
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// virtual de edad (útil para mostrar en Profile)
UserSchema.virtual('age').get(function () {
  if (!this.birthdate) return undefined;
  const today = new Date();
  let age = today.getFullYear() - this.birthdate.getFullYear();
  const m = today.getMonth() - this.birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.birthdate.getDate())) age--;
  return age;
});

export default mongoose.model('User', UserSchema);
