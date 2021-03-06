const router = require("express").Router();
const Cryptr = require("cryptr");

const CwcEmployee = require("../models/cwcEmployee");
const Cwc = require("../models/cwc");
const Cci = require("../models/cci");
const Child = require("../models/child");
const { get } = require("request");

//FOR GETTING THE FORM TO REGISTER A NEW CHILD
//SNOOZING ACTION TAKING
router.get(
  "/cwc/dashboard/snooze/:employee_id/:child_id/:numberOfDays",
  async (req, res) => {
    const child = await Child.findOne({
      child_id: req.params.child_id,
    });
    const employee = await CwcEmployee.findOne({
      employee_id: req.params.employee_id,
    });

    numberOfDays = Number(req.params.numberOfDays);

    var nextDate = child.nextStatusEvaluationDate;
    nextDate.setDate(nextDate.getDate() + numberOfDays);

    try {
      updatedChild = await Child.updateOne(
        { child_id: req.params.child_id },
        {
          nextStatusEvaluationDate: nextDate,
        }
      );
      res.redirect("/cwc/dashboard/" + employee.employee_id);
    } catch (err) {}
  }
);

router.get(
  "/cwc/dashboard/childRegistration/:employee_id",
  async (req, res) => {
    const idToSearch = req.params.employee_id;
    const employee = await CwcEmployee.findOne({ employee_id: idToSearch });

    const cwc = await Cwc.findOne({ cwc_id: employee.cwc_id });
    const cci_list = await Cci.find(
      { cwc_id: employee.cwc_id },
      { _id: 0, cci_name: 1, cci_id: 1 }
    );
    const allCci = await Cci.find({ district: cwc.district });

    res.render("CWC/cwcdashboard-childRegistration.ejs", {
      employee: employee,
      allCci: allCci,
      district: cwc.district,
      cci_list: cci_list,
    });
  }
);

//CHANGING ELIGIBILITY VALUE
router.get(
  "/cwc/dashboard/addToRecommendationList/:employee_id/:child_id",
  async (req, res) => {
    const employee = await CwcEmployee.findOne({
      employee_id: req.params.employee_id,
    });
    try {
      updatedChild = await Child.updateOne(
        { child_id: req.params.child_id },
        { isUpForAdoption: true }
      );

      res.redirect("/cwc/dashboard/" + employee.employee_id);
    } catch (err) {}
  }
);

//CHILDREN LIST PAGE
router.get("/cwc/dashboard/allChildren/:employee_id", async function (
  req,
  res
) {
  const idToSearch = req.params.employee_id;
  const employee = await CwcEmployee.findOne({ employee_id: idToSearch });
  const cwc = await Cwc.findOne({ cwc_id: employee.cwc_id });
  const cci_list = await Cci.find(
    { cwc_id: employee.cwc_id },
    { _id: 0, cci_name: 1, cci_id: 1 }
  );
  const child = await Child.find({ cwc_id: employee.cwc_id });

  res.render("CWC/allChildrenInCwc.ejs", {
    employee: employee,
    cci_list: cci_list,
    child: child,
    cwc: cwc,
  });
});

//VIEW INDIVIDUAL CHILD's DATA
router.get(
  "/cwc/dashboard/allChildren/viewChildDetails/:employee_id/:child_id",
  async (req, res) => {
    const employee = await CwcEmployee.findOne({
      employee_id: req.params.employee_id,
    });
    const child = await Child.findOne({ child_id: req.params.child_id });
    const cci_list = await Cci.find(
      { cwc_id: employee.cwc_id },
      { _id: 0, cci_name: 1, cci_id: 1 }
    );

    //DECRYPTING AADHAR NUMBER
    const secret = String(JSON.stringify(process.env.AADHAR_KEY));
    cryptr = new Cryptr(secret);

    if (child.aadharNumber) {
      if (child.aadharNumber.length > 20) {
        var decryptedAadharNum = cryptr.decrypt(child.aadharNumber);
        decryptedAadharNum =
          String(decryptedAadharNum.substring(0, 6)) + "********";
        child.aadharNumber = decryptedAadharNum;
      } else {
        child.aadharNumber = child.aadharNumber.substring(0, 6) + "********";
      }
    }

    res.render("CWC/viewdetailsofa-child.ejs", {
      employee: employee,
      cci_list: cci_list,
      child: child,
    });
  }
);

//EDIT INDIVIDUAL CHILD'S DATA
router.get(
  "/cwc/dashboard/editChildDetails/:employee_id/:child_id",
  async (req, res) => {
    const employee = await CwcEmployee.findOne({
      employee_id: req.params.employee_id,
    });
    const child = await Child.findOne({ child_id: req.params.child_id });
    const cci_list = await Cci.find(
      { cwc_id: employee.cwc_id },
      { _id: 0, cci_name: 1, cci_id: 1 }
    );

    res.render("CWC/editDetailsofChild2.ejs", {
      employee: employee,
      cci_list: cci_list,
      child: child,
    });
  }
);

router.post(
  "/cwc/dashboard/editChildDetails/:employee_id/:child_id",
  async (req, res) => {
    // const child = await Child.findOne({ });
    updatedChild = await Child.updateOne(
      { child_id: req.params.child_id },
      {
        firstName: req.body.firstName,
        // middleName: req.body.middleName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        caste: req.body.caste,
        // aadharNumber: req.body.aadharNumber,
        fatherName: req.body.fatherName,
        motherName: req.body.motherName,
        // religion: req.body.religion,
      }
    );
    res.redirect(
      "/cwc/dashboard/editChildDetails/" +
        req.params.employee_id +
        "/" +
        req.params.child_id
    );
  }
);

//CCI INFORMATION
router.get("/cwc/dashboard/cciDetails/:employee_id", async (req, res) => {
  const employee = await CwcEmployee.findOne({
    employee_id: req.params.employee_id,
  });

  const cci_list = await Cci.find(
    { cwc_id: employee.cwc_id },
    { _id: 0, cci_name: 1, cci_id: 1 }
  );
  const cwc = await Cwc.findOne({ cwc_id: employee.cwc_id });
  allCci = await Cci.find({ district: cwc.district });

  try {
    res.render("CWC/showCciInformation.ejs", {
      allCci: allCci,
      district: cwc.district,
      employee: employee,
      cci_list: cci_list,
    });
  } catch (err) {
    console.log("There is an error in the cwc route : ");
    console.log(err);
  }
});

//CWC DASHBOARD
router.get("/cwc/dashboard/:employee_id", async function (req, res) {
  const employee = await CwcEmployee.findOne({
    employee_id: req.params.employee_id,
  });
  const recommendedChildren = await Child.find({ isUpForAdoption: true });
  const cwc_id = employee.cwc_id;
  const cwc = await Cwc.findOne({ cwc_id: cwc_id });

  const cwcEmployee_count = await CwcEmployee.countDocuments({
    cwc_id: cwc_id,
  });
  const cci_list = await Cci.find(
    { cwc_id: cwc_id },
    { _id: 0, cci_name: 1, cci_id: 1 }
  );
  const cci_count = await Cci.countDocuments({ cwc_id: cwc_id });

  //TO FIND OUT THE CHILDREN WHO ARE DUE FOR REEVALUATION
  const currentDate = new Date();
  const children = await Child.find({
    nextStatusEvaluationDate: { $lt: currentDate },
    isUpForAdoption: false,
  });

  res.render("CWC/dashboardHome.ejs", {
    employee: employee,
    cci_list: cci_list,
    cwc: cwc,
    cci_count: cci_count,
    cwcEmployee_count: cwcEmployee_count,
    children: children,
    recommendedChildren: recommendedChildren,
  });
});

module.exports = router;
