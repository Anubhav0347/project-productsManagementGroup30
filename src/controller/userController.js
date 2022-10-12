const userModel = require('../models/userModel')
const bcrypt = require('bcrypt');
const upload = require('../aws/config')
const validation = require("../validations/validator.js")
const jwt = require("jsonwebtoken");
const multer = require("multer")
const mongoose = require("mongoose");




//====================================  Creating Users  ======================================//

const createUser = async function (req, res) {
   try{
    let data = req.body;

    const { fname, lname, email, phone, password, address } = data;

    if (!validation.isValidBody(data)) {
        return res.status(400).send({ status: false, msg: "Please provide data in the request body!" })
    }

    if(!fname) return res.status(400).send({status : false, message : "First Name is required!"})
    if (!validation.isValid(fname) && !validation.alphabetTestOfString(fname)) {
        return res.status(400).send({ status: false, msg: "fname is invalid" })
    }

    if(!lname) return res.status(400).send({status : false, message : "Last Name is required!"})
    if (!validation.isValid(lname) && !validation.alphabetTestOfString(lname)) {
        return res.status(400).send({ status: false, msg: "lname is invalid" })
    }

    if(!email) return res.status(400).send({status : false, message : "Email is required!"})
    if (!validation.isValidSyntaxOfEmail(email)) {
        return res.status(400).send({ status: false, msg: "Email is invalid!" })
    }
    let userEmail = await userModel.findOne({ email : email })
    if (userEmail)
        return res.status(401).send({ status: false, msg: "This email address already exists, please enter a unique email address!" })


    if(!phone) return res.status(400).send({status : false, message : "Phone number is required!"})
    if (!validation.isValidMobileNum(phone)) {
        return res.status(400).send({ status: false, msg: "Phone is invalid" })
    }
    let userNumber = await userModel.findOne({ phone: phone })
    if (userNumber)
        return res.status(409).send({ status: false, msg: "This phone number already exists, please enter a unique phone number!" })

    if(!password) return res.status(400).send({status : false, message : "Password is required!"})
    if (!validation.isValidPassword(password)) {
        return res.status(400).send({ status: false, msg: "Password should be strong, please use one number, one upper case, one lower case and one special character and characters should be between 8 to 15 only!" })
    }

  //  const salt = await bcrypt.genSalt(10) // creates special characters
  //  data.password = await bcrypt.hash(data.password, salt) // applies special characters generated by genSalt to password


    if(!address.shipping.street) return res.status(400).send({status : false, message : "Shipping Street is required!"})
    if (!validation.isValid(address.shipping.street)) {
        return res.status(400).send({ status: false, msg: "Invalid shipping street!" })
    }

    if(!address.shipping.city) return res.status(400).send({status : false, message : "Shipping City is required!"})
    if (!validation.isValid(address.shipping.city)) {
        return res.status(400).send({ status: false, msg: "Invalid shipping city!" })
    }

    if(!address.shipping.pincode) return res.status(400).send({status : false, message : "Shipping Pincode is required!"})
    if (!validation.isValidPinCode(address.shipping.pincode)) {
        return res.status(400).send({ status: false, msg: "Invalid shipping pincode!" })
    }

    if(!address.billing.street) return res.status(400).send({status : false, message : "Billing Street is required!"})
    if (!validation.isValid(address.billing.street)) {
        return res.status(400).send({ status: false, msg: "Invalid billing street!" })
    }

    if(!address.billing.city) return res.status(400).send({status : false, message : "Billing City is required!"})
    if (!validation.isValid(address.billing.city)) {
        return res.status(400).send({ status: false, msg: "Invalid billing city!" })
    }

    if(!address.billing.pincode) return res.status(400).send({status : false, message : "Billing Pincode is required!"})
    if (!validation.isValidPinCode(address.billing.pincode)) {
        return res.status(400).send({ status: false, msg: "Invalid billing pincode!" })
    }


    let files = req.files
    if (files && files.length > 0) {
      
        let uploadedFileURL = await upload.uploadFile(files[0])
      
        data.profileImage = uploadedFileURL;
    }
    else {
        res.status(400).send({ msg: "Files are required!" })
    }
    const document = await userModel.create(data)
    res.status(201).send({ status: true, data: document })

}catch(error){
    res.status(500).send({message : error.message})
}
}


//*****Valid********** 
const isValidObjectId = (ObjectId) => {
  return mongoose.Types.ObjectId.isValid(ObjectId);
};

const isValidRequest = function (object) {
  return Object.keys(object).length > 0;
};

const nameregex = /^[a-zA-Z\. ]*$/;
const phoneregex = /^([6-9]\d{9})$/;
const emailregex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
const passwordregex = /^[a-zA-Z0-9!@#$%^&*]{8,15}$/;
const pinregex = /^\d{6}$/;
const streetregex = /^[0-9\\\/# ,a-zA-Z]+[ ,]+[0-9\\\/#, a-zA-Z]{1,}$/;

//*********************POST LOGIN************************** 
const loginUser = async function (req, res) {
  try {
    let emailId = req.body.email;
    console.log(emailId);
    let password = req.body.password;
    if (!emailId || !password) {
      return res.status(400).send({ status: false, message: "please enter email and password" });
    }
    if (!emailId.match(emailregex))
      return res.status(400).send({ status: false, message: "email should be valid" });
    if (!password.match(passwordregex))
      return res.status(400).send({ status: false, message: "password should be valid" });

    const user = await userModel.findOne({
      email: emailId,
    });
    if (!user) {return res.status(400).send({ status: false, message: "email or password is not correct" });
    } else {
      const token = jwt.sign(
        {
          userId: user._id.toString(),
        },
        "Group30-Project-Shopping-cart",
        { expiresIn: "900m" }
      );
      res.setHeader("x-api-key", token);
      return res.status(201).send({
        status: true,
        message: "Success",
        data: { userId: user._id, token: token },
      });
    }
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};

//**********************PUT API USER************************************
const updateProfile = async function (req, res) {
  try {
    const userId = req.params.userId;
    let data = req.body;

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid userId" });

    if (!isValidRequest(data))
      return res
        .status(400)
        .send({
          status: false,
          message: "for registration user data is required",
        });

    let { fname, lname, email, profileImage, phone, password, address } =req.body;

    let files = req.files;
    if (files && files.length > 0) {
      let uploadedFileURL = await uploadFile(files[0]);
      profileImage = uploadedFileURL;
    } else {
      return res.status(400).send({ message: "No file found" });
    }
//*****************FNAME VALIDATION***********
    if (fname) {
      if (!fname.match(nameregex)) {
        return res
          .status(400)
          .send({ status: false, message: "Please enter a valid FName" });
      }
    }
//*****************LNAME VALIDATION***********
    if (lname) {
      if (!lname.match(nameregex)) {
        return res
          .status(400)
          .send({ status: false, message: "Please enter a valid LName" });
      }
    }
//*****************EMAIL VALIDATION***********
    if (email) {
      if (!email.match(emailregex)) {
        return res
          .status(400)
          .send({ status: false, message: "Please Enter valid Email" });
      }
      let existEmail = await userModel.findOne({ email: email });
      if (existEmail) {
        return res
          .status(400)
          .send({
            status: false,
            message: "User with this email is already registered",
          });
      }
    }
//*****************Phone VALIDATION***********
    if (phone) {
      if (!phone.match(phoneregex)) {
        return res
          .status(400)
          .send({ status: false, message: "Please Enter valid phone Number" });
      }
      let existphone = await userModel.findOne({ phone: phone });
      if (existphone) {
        return res.status(400).send({
          status: false,
          message: "User with this phone number is already registered.",
        });
      }
    }
 //***********PASSWORD VALIDATIONS********
    if (password) {
      if (!password.match(passwordregex)) {
        return res.status(400).send({
          status: false,
          message: "please Enter valid password and it's length should be 8-15",
        });
      }
    }
//*****************ADDRESS VALIDATIONS**************
 //_________Shipping address validations___________
    if (address) {
      if (address["shipping"]) {
        if (address["shipping"]["street"]) {
          if (address.shipping.street.trim().length == 0 &&  !streetregex(address.shipping.street) )
            return res
              .status(400)
              .send({
                status: false,
                message: "Please enter valid street address for shipping ",
              });
        }
        if (address.shipping.city) {
          if (address.shipping.city.trim().length == 0)
            return res.status(400).send({
              status: false,
              message: "Please enter valid city address for shipping ",
            });
        }
        if (address.shipping.pincode) {
          if (!pinregex(address.shipping.pincode))
            return res.status(400).send({
              status: false,
              message: "Please enter valid shipping address pincode",
            });
        }
      }
//______________Billing address validations__________
      if (address["billing"]) {
        if (address["billing"]["street"]) {
          if (address.billing.street.trim().length == 0 && !streetregex(address.shipping.street) )
            return res.status(400).send({
              status: false,
              message: "Please enter valid street address for billing ",
            });
        }
        if (address.billing.city) {
          if (address.billing.city.trim().length == 0)
            return res.status(400).send({
              status: false,
              message: "Please enter valid city address for billing ",
            });
        }
        if (address.billing.pincode) {
          if (!pinregex(address.billing.pincode))
            return res.status(400).send({
              status: false,
              message: "Please enter valid billing address pincode",
            });
        }
      }
    }
  //*****BCRYPT SALT*******
    const salt = await bcrypt.genSalt(13);
    password = await bcrypt.hash(req.body.password, salt);
    console.log(password);
    
  //******UPDATE*****************
    const updates = {
      fname: fname,
      lname: lname,
      email: email,
      profileImage: profileImage,
      phone: phone,
      password: password,
      address: address,
    };

    let updateUser = await userModel.findByIdAndUpdate(
      { _id: userId },
      { $set: { ...updates } },
      { new: true }
    );
    return res.status(200).send({ status: true, data: updateUser });
  } catch (error) {
    return res.status(500).send({ status: false, error: error.message });
  }
};


module.exports={createUser,loginUser,updateProfile}





