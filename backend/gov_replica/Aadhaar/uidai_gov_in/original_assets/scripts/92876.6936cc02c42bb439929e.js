"use strict";
(self["webpackChunkmyaadhaar_revamp_ui_integrated"] = self["webpackChunkmyaadhaar_revamp_ui_integrated"] || []).push([[92876],{

/***/ 87177
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

const TRANSLATIONS_EN = {
  dashboard: {
    header: {
      title: "myAadhaar",
      profile: {
        aadhaarTagLine: "Mera Aadhaar, Meri Pehchaan",
        clickToFlip: "Flip Aadhaar Card",
        logOut: "Logout"
      }
    },
    services: {
      title: "Services",
      description: "Following bouquet of online Aadhaar services are available for access. Click on the tab to navigate to the service-specific page.",
      serviceCards: {
        downloadAadhaar: {
          title: "Download Aadhaar",
          description: "Click here to download digitally signed and password protected electronic copy of the Aadhaar."
        },
        orderPVC: {
          title: "Order Aadhaar PVC Card",
          description: "Click here to order a secure, wallet-sized Aadhaar PVC card."
        },
        updateAadhaarOnline: {
          updateAadhaarOnline: "Update Aadhaar Online",
          updateAadhaar: "updateAadhaar",
          headerTitle: "Please select the type of Online Aadhaar Update",
          title: "Address update",
          description: "Click here to update the Address of your Aadhaar. For any other update, kindly visit nearest Aadhaar Seva Kendra.",
          description2: "Shifted to a new place? Update your Aadhaar address online using valid address proof—quick, easy, and fully digital."
        },
        updateAddress: {
          title: "Update address using your documents",
          description: "Shifted to a new place? Update your Aadhaar address online using valid address proof—quick, easy, and fully digital."
        },
        bankLinkingStatus: {
          title: "Bank linking status",
          description: "Click here to check the Aadhaar and bank account linking status."
        },
        generateVirtualID: {
          title: "Generate / Retrieve Virtual ID",
          description: "Virtual ID(VID) can be used in-lieu of the Aadhaar number. Click here to download 16 digits random VID."
        },
        offlineEkyc: {
          title: "Offline e-KYC",
          description: "Click here to access secure and shareable e-KYC document, used for offline identification verification."
        },
        lockUnlockBiometrics: {
          title: "Lock / Unlock Biometrics",
          description: "Click here to temporarily lock/unlock your biometrics information."
        },
        lockUnlockAadhaar: {
          title: "Lock / Unlock Aadhaar",
          description: "Click here to temporarily lock/unlock your Aadhaar. Please use this service carefully."
        },
        paymentHistory: {
          title: "Payment history",
          description: "Click here to view the payment and refund status."
        },
        hofRequests: {
          title: "My Head of Family(HoF) requests",
          description: "Click here to check HoF based Address Sharing Requests"
        },
        aadharUpdateHistory: {
          title: "Aadhaar update history",
          description: "Click here to find your Aadhaar update history."
        },
        bankSeedingStatus: {
          title: "Check Bank Seeding Status",
          description: "Click here to find your Bank Seeding Status."
        },
        deathStatus: {
          title: "Update Deceased Status",
          description: "Click here to report death of a Family Member for his/her Aadhaar deactivation."
        },
        authenticationHistory: {
          title: "Authentication history",
          description: "Click here to view the authentication history",
          heading: "Please select Authentication Date Range to Fetch Authentication History",
          modality: "Select Modality",
          fieldStartText: "Enter Start Date",
          fieldEndText: "Enter End Date",
          button: "Fetch Authentication History",
          tableHeading: "Your Selection has resulted in {{txnNumber}} Authentications",
          dateRange: "Aadhaar number holder can view details of all the authentication performed by any Authentication User Agency (AUA) or by him/her in the last 6 months.",
          filterName: "Select Modality",
          note: {
            l1: "Note: ",
            l2: "AUA Transaction Id: ",
            l3: "Unique Aadhaar transaction Id at the time of request.",
            l4: "List of Authentication User Agency: ",
            l5: "In case of any issues regarding a transaction, contact the AUA for that transaction. ",
            l6: "Click here to view details.",
            l7: "Authentication Response: ",
            l8: "Success / Failure",
            l9: "UIDAI Error Codes: ",
            l10: "Aadhaar authentication error codes. ",
            l11: "Click here",
            l12: "FAQs: ",
            l13: "Authentication Transaction History. ",
            l14: "Click here",
            l15: "Auth Modality: ",
            l16: "Method of Aadhaar Authentication",
            l17: "The Authentication History PDF Password will be in 8 characters. Combination of the first four letters of your name (as in Aadhaar) in CAPITAL letters and Year of Birth in YYYY format."
          }
        },
        documentUpdate: {
          title: "Update Documents",
          description: "Click Here to upload your Proof of Identity (PoI) and Proof of Address (PoA) Documents."
        }
      }
    },
    requests: {
      title: "My online requests",
      description: "The present status of your recent requests is shown below. You can view the detailed information for each request by clicking the adjacent downward arrow icon.",
      serviceName: "Service Name",
      status: "Status",
      srnUrnEid: "SRN / URN / EID",
      created: "Created Date",
      orderPVC: "Order PVC Aadhaar Card",
      inProcess: "In Process",
      stepper: {
        language: "Language",
        name: "Name",
        dob: "DoB",
        gender: "Gender",
        preview: "Preview",
        payment: "Payment"
      }
    },
    history: {
      title: "My transaction history",
      description: ""
    },
    requestsLarge: {
      serviceName: "Service Name",
      srnUrnEid: "SRN / URN / EID",
      created: "Created Date",
      status: "Status",
      resume: "Resume",
      delete: "Delete",
      aadhaarUpadate: "Aadhaar Update",
      hof: "Family member based Address update",
      errorMessage: "Reason For Error With Description Reason For Error With Description Reason For Error With Description",
      description: "Dependency on SRN 0000 1234 1234 Waiting Period for Print: 2 Hours, for more clarification Dial Helpline Number: 1947"
    },
    deletePopUp: {
      heading: "Are you sure to delete your update request?",
      description: "This action will permanently delete your request from our database. Please click on 'Okay' to confirm."
    }
  },
  unauthenticatedDashboard: {
    WelcomeToMyAadhaar: "Welcome to myAadhaar",
    description1: "Inviting early ",
    description2: "adopters to test the ",
    description3: "Aadhaar app",
    download: "Download Now!",
    feedback: "Share feedback at ",
    loginCard: {
      loginText: "Login",
      desc: "Login with Aadhaar and OTP"
    },
    services: {
      description: "If your mobile number is not registered with Aadhaar, or you have just enrolled yourself to the world’s largest identity platform, you can still use the following services.",
      GenericDescription: "Services that can be availed even if mobile number is not registered with Aadhaar",
      MobileDescription: "Services that require mobile number to be registered with Aadhaar",
      MoblieNotRegistered: "Mobile not Registered with Aadhaar?",
      StepsToRegisterText: "Please follow these steps to get it registered.",
      AadhaarEnrolmentUpdateCharges: "Aadhaar Enrolment & Update Charges",
      AadhaarEnrolmentUpdateChargesForm: "Enrolment & Update Forms",
      ListofDocs: "List of Supporting Documents for Aadhaar Enrolment & Update",
      serviceCards: {
        downloadAadhaar: {
          title: "Download Aadhaar",
          description: "Click here to download digitally signed and password protected electronic copy of the Aadhaar."
        },
        orderPVC: {
          title: "Order Aadhaar PVC card",
          description: "Click here to order a secure, wallet-sized Aadhaar PVC card."
        },
        retrieveEID: {
          title: "Retrieve Aadhaar number / EID / SID",
          description: "Click here to find out Aadhaar number, Enrolment ID (EID) or Service ID (SID)."
        },
        verifyMobile: {
          title: "Check Email / Mobile Link",
          description: "Click here to verify mobile and email registered with the Aadhaar."
        },
        checkAadhaarValidity: {
          title: "Check Aadhaar Status",
          description: "Click here to validate the status of the Aadhaar."
        },
        orderPVCStatus: {
          title: "Check PVC Card Order Status",
          description: "Click here to check the status of the already ordered PVC card."
        },
        enrolmentAndUpdateStatus: {
          title: "Check  enrolment or update status",
          description: "Click here to check the status of the Enrolment or Update request."
        },
        deathReportStatus: {
          title: "Check deceased Aadhaar deactivation status",
          description: "Click here to check the status of the Deceased Aadhaar Deactivation request."
        },
        bookAppointment: {
          title: "Book an appointment",
          description: "Click here to book an Appointment for Enrolment or Update."
        },
        vidGenerator: {
          title: "VID generator",
          description: "Click here to generate 16 Digit Virtual ID(VID) linked to your Aadhaar."
        },
        lec: {
          title: "Locate enrolment center",
          description: "Click here to search and locate nearby Aadhaar Seva Kendras."
        },
        lockUnlockAadhaar: {
          title: "Lock / Unlock Aadhaar",
          description: "Click here to temporarily lock/unlock your Aadhaar. Please use this service carefully."
        },
        authenticationHistory: {
          title: "Authentication history",
          description: "Click here to view the authentication history"
        },
        complaintStatus: {
          title: "Check Grievance / Feedback Status",
          description: "Click here to check the status of the Grievance / Feedback"
        },
        fileComplaint: {
          title: "Raise a Grievance / Feedback",
          description: "Click here to file your grievance and feedback"
        }
      }
    }
  },
  documentUpdate: {
    intentPage: {
      title: "Objective of Update Documents Service",
      p1: "Dear Resident,",
      p2: "You are advised to strengthen your Aadhaar by updating documents in your Aadhaar database by submitting latest Proof of Identity (POI) and Proof of Address (POA) documents. The details in POI/POA documents must match with your details mentioned in your Aadhaar. This shall help you in ensuring continued accuracy of your information in the Aadhaar database.",
      p3: "If you have already updated the documents through any of the Aadhaar Enrolment Centers or through myAadhaar portal, please wait for its acceptance or otherwise. In case of rejection of the request submitted, you may have to update again.",
      p4: "If you are looking to update Address in your Aadhaar, please",
      p5: "click here.",
      p6: "A nominal charge of Rs. 25/- to be paid for the services, which is non refundable.",
      p7: "This service is free of cost till 14/06/2027."
    },
    howItWorks: {
      description: "Please read the following steps carefully. Follow the actions suggested at various steps to avoid any delay in processing or rejection of the request. If you are looking to Update your Address, Please",
      stepDescription: {
        one: "Click Here to upload your Proof of Identity (PoI) and Proof of Address (PoA) Documents.",
        two: "In this step, you will be asked to upload the valid POI/POA documents that contain verified details confirmed in Step 1.",
        three: "You have to pay ₹ 25 (Rupees Twenty Five only) towards this service. You can make the payment through credit/debit card or net banking. This amount is non-refundable."
      },
      note: "If you are looking to update your Demographics details (Name, DoB, Gender or Address), visit nearest Aadhaar center and For Address only Update click",
      noteLink: "here."
    },
    currentSection: {
      form: {
        title: "Please Verify Your Demographic Details",
        name: "Name",
        gender: "Gender",
        dob: "Date of Birth",
        address: "Address",
        consent: "I verify that the above details are correct."
      },
      note: "If there is mismatch in any of your details, please update your Demographic details(Name, Address, DoB or Gender) at nearest Aadhaar center and For Address only Update click ",
      noteLink: "here."
    },
    uploadSection: {
      confirmationPopUp: {
        title: "Please confirm your demographic details in the documents exactly matches with your demographic details in Aadhaar"
      },
      stepper: {
        verify: "Verify",
        upload: "Upload"
      },
      guidelines: {
        title: "Guidelines for uploading Documents",
        l1: "Document size should be less than 2 MB",
        l2: "Supported file Formats are: <b>JPEG, PNG</b> and <b>PDF</b>"
      },
      form: {
        poiTitle: "Please upload Proof Of Identity (POI) Document",
        poaTitle: "Please upload Proof Of Address (POA) Document"
      },
      consent: "I hereby give my consent that the information/documents provided/uploaded by me may be subjected to verification at any stage by the Government."
    },
    faq: {
      card: {
        heading: "Update Documents",
        description_1: "Document update details",
        description_2: "Document update details"
      },
      guidelines: {
        heading_1: "Upload documents in support of identity and address",
        heading_2: "Free till 14/06/2027",
        question_1: {
          title: "What to submit?",
          content: {
            line_1: "Ration card, Voter identity card,  Government-issued identity card/ certificate having address, and Indian Passport serve as proof of both identity and address.",
            line_2: "PAN card, Driving license, Secondary or Senior School mark sheet/ School leaving certificate having photograph, Government-issued identity card/ certificate - serve as only proof of identity.",
            line_3: "Electricity/water/gas bill (last 3 months), Bank / Post Office passbook,  rent/ lease/ leave & license agreement serve as proof of address only.",
            line_4: "For detailed list of acceptable identity and address documents, please  click here.",
            line_5: " here"
          }
        },
        question_2: {
          title: "How to submit?",
          content: {
            line_1: "The documents can be submitted online on myAadhaar portal or by visiting any Aadhaar centre.",
            line_2: "For step by step procedure for submission of documents online please click here.",
            line_3: " here"
          }
        },
        main_content: {
          submit: "Click to submit",
          title: "Need Help?",
          videoText: "Video guide",
          knowMoreText: "Know More?",
          callText: "Call toll-free (1947)"
        }
      },
      one: {
        title: "Why should I submit the identity and address documents for my Aadhaar?",
        content: "Updated supporting documents for identity and address for Aadhaar enable ease of living, better service delivery and accurate authentication. Therefore, submitting recent identity and address documents is in the interest of the Aadhaar number holder."
      },
      two: {
        title: "What documents should I submit for my identity and address?",
        content: {
          para_1: {
            heading_one: "Document for both identity and address:",
            list_1: "(a) Ration card",
            list_2: "(b) Voter identity card",
            list_3: "(c) Kisan photo passbook",
            list_4: "(d) Indian passport",
            list_5: "(e) Government - issued identity card / certificate1, ST / SC / OBC certificate or marriage certificate, having photograph",
            list_6: "(f) Disability identity card / certificate of disability",
            list_7: "(g) Transgender identity card / certificate",
            list_8: "(h) Certificate issued in UIDAI standard certificate format in respect of a sex worker",
            list_9: "(i) Certificate issued in UIDAI standard certificate format by recognised shelter homes or orphanages",
            list_10: "(j) Prisoner induction document issued by Prison Officer"
          },
          para_2: {
            heading_one: "Document for identity:",
            list_1: "(a) School leaving certificate / school transfer certificate with photograph",
            list_2: "(b) Marksheet/certificate issued by recognised Board of Education or University with photograph",
            list_3: "(c) PAN/e-PAN card",
            list_4: "(d) Government/statutory-body/PSU-issued employee/pensioner photo identity card, pension payment order or medi-claim card",
            list_5: "(e) Driving licence",
            list_6: "(f) Freedom fighter photo identity card"
          },
          para_3: {
            heading_one: "Document for address:",
            list_1: "(a) Electricity, water, gas or telephone/mobile/broadband bill (not more than three months old)",
            list_2: "(b) Duly signed and stamped Scheduled Commercial Bank / Post Office passbook with photograph",
            list_3: "(c) Duly signed and stamped Scheduled Commercial Bank / Post Office account/credit-card statement (not more than three months old)",
            list_4: "(d) Valid rent, lease or leave & licence agreement",
            list_5: "(e) Certificate issued in UIDAI Standard Certificate format by MP, MLA, MLC, Municipal Councillor, Group 'A' or ‘B’ Gazetted Officer, EPFO Officer or Tahsildar",
            list_6: "(f) Certificate issued in UIDAI Standard Certificate format by Village Panchayat Head/Secretary, Village Revenue Officer or equivalent (for rural areas)",
            list_7: "(g) Certificate issued to a student in UIDAI Standard Certificate format by the head of the recognised educational institution concerned",
            list_8: "(h) Property tax receipt (not more than one year old)",
            list_9: "(i) Valid registered sale agreement or gift deed",
            list_10: "(j) Government/statutory-body/PSU-issued accommodation allotment letter (not more than one year old)",
            list_11: "(k) Life or medical insurance policy (not more than one year old)"
          }
        }
      },
      three: {
        title: "How can I submit the documents?",
        content: "The documents can be submitted online through  MyAadhaar Portal or at any Aadhaar Enrolment Centre. For a tutorial video in this regard, please click here https://www.youtube.com/watch?v=1jne0KzFcF8 "
      },
      four: {
        title: "How can I submit the documents online?",
        content: {
          list_1: "Please log in to MyAadhaar Portal using your Aadhaar number and one-time password (OTP) received on your registered mobile number.",
          list_2: "List of supporting documents is available at https://uidai.gov.in/images/commdoc/List_of_Supporting_Document_for_Aadhaar_Enrolment_and_Update.pdf"
        }
      },
      five: {
        title: "If the address displayed in my profile does not match with my current address, what should I do?",
        content: "You can update your address online through myAadhaar portal or by visiting any Aadhaar Enrolment Centre by enrolling with valid POA document."
      },
      six: {
        title: "If any identity detail (name, gender or date of birth) does not match my actual identity details, what should I do?",
        content: "Please visit an Aadhaar centre with original identity documents as listed https://uidai.gov.in/images/commdoc/List_of_Supporting_Document_for_Aadhaar_Enrolment_and_Update.pdf"
      },
      seven: {
        title: "If I want to submit documents offline, how can I locate an Aadhaar centre?",
        content: {
          list_1: "(1) Please go to https://bhuvan.nrsc.gov.in/aadhaar/",
          list_2: "(2) For locating nearby Aadhaar centres, click on the ‘Centres Nearby’ tab. Enter your location details to view nearby Aadhaar centres.",
          list_3: "(3) For locating the Aadhaar centres within your PIN code area, click on the ‘Search by PIN Code’ tab. Enter your area PIN code to view Aadhaar centres in that area."
        }
      },
      eight: {
        title: "What is the charge for submitting the documents?",
        content: "For submission of documents at an Aadhaar centre, the applicable charge is Rs. 50. Submission of documents may also be done through myAadhaar portal."
      },
      nine: {
        title: "By when should I submit the documents? ",
        content: "Aadhaar number holders are suggested to update documents in Aadhaar at least once in 10 years. Once you receive any communication in this regard, it is suggested to update the documents at an early date."
      },
      ten: {
        title: "I am a non-resident Indian (NRI). How can I submit the documents? ",
        content: "You can submit the documents whenever you are in India, through online or by visiting Aadhaar Centre."
      }
    }
  },
  deathStatus: {
    title: "Deceased Details",
    form: {
      DropdownState: {
        label: "Name of the state that issued the death certificate* ",
        description: "Death reporting for registrations done in the remaining states will be available in due course."
      },
      AadhaarNumber: {
        label: "Aadhaar Number of deceased person*"
      },
      drnField: {
        label: "Death Registration Number*",
        description: "Please enter DRN in one of the following formats"
      },
      nameField: {
        label: "Name of the deceased person as in death certificate*"
      },
      genderField: {
        label: "Gender of the deceased person",
        M: "Male",
        f: "Female",
        o: "Others"
      },
      dodField: {
        label: "Date of death of deceased person*"
      },
      dodCertificateField: {
        label: "Date of issue of death certificate*"
      },
      uploadCrtificateField: {
        label: "Upload Death Certificate*"
      },
      relationField: {
        label: "Informant's relationship with the deceased*"
      },
      checkboxField: {
        description: "I hereby confirm and declare that all the information and documents submitted is correct to the best of my knowledge and belief. I understand that if the above declaration is found to be incorrect, my Aadhaar number may be deactivated and, in addition, action may be taken against me as per law"
      }
    }
  },
  ssup: {
    howItWorks: {
      title: "How it Works?",
      description: "Please read the following steps to understand the online update process. Follow the actions suggested at various steps to avoid any delay in processing or rejection of the request.",
      proceedToUpdateAadhaar: "Proceed to Update Aadhaar",
      stepDescription: {
        //one: "Select the demographics field to update from the list. Through this online portal, you can update your Name (minor correction only), Date of Birth(DoB), Gender and Address. For mobile number, email and biometrics data, please visit the nearest Aadhaar Seva Kendra.",
        one: "Select the Address field to update from the list. Through this online portal, you can update Address. For Name, Gender, DOB, mobile number, email and biometrics data, please visit the nearest Aadhaar Seva Kendra.",
        two: "Please enter the required demographic data. Some of the demographic data require selection from the dropdown list. Please be careful while entering the demographics data or selecting from the dropdown options.",
        //three:
        //  "Name (minor correction only), Address and Date of Birth correction requires scanned copy of the original supporting document. Please make sure that the supporting document is in your name and valid. If you are providing a certificate in UIDAI standard format, please check for common mistakes like Issue date, Crossed sign, Stamp across Photo and No Overwriting to avoid rejection of the request.",
        three: "Address update requires scanned copy of the original supporting document. Please make sure that the supporting document is in your name and valid. If you are providing a certificate in UIDAI standard format, please check for common mistakes like Issue date, Crossed sign, Stamp across Photo and No Overwriting to avoid rejection of the request.",
        four: "You have to pay ₹ 50 (Rupees fifty only) towards the online update fee. You can make the payment through credit/debit card or net banking. This amount is non-refundable. In case of payment failure, you can retry the payment.",
        five: "You will obtain a Service Request Number (SRN) as a reference. Preserve this number to track the update request or for any future communication with UIDAI helpdesk.",
        six: "Your request will be verified by our internal quality check operators. At this stage provided demographics data will be checked against the supporting document. If there is a mismatch, your request is likely to be rejected.",
        seven: "On completion of the quality check process, you will receive an SMS notification containing the Enrolment ID an outcome.",
        eight: "After a few more validations by our backend software, your request processing will be completed. You will get an SMS notification on the outcome.",
        nine: "Normally update request is completed within 30 days with 90% service standards. However, we are improving our systems and in most likelihood, your request would be updated earlier to the mentioned time. You can check the status of the request processing by visiting myaadhaar.uidai.gov.in."
      }
    },
    updateSelectPage: {
      title: "Online Update Services",
      selectFields: {
        smallDescription: "Select Aadhaar data field(s) to update.",
        longDescription: "Select any of the following Aadhaar data field(s) to update.",
        updatesLeft: " Updates Left",
        noLimit: "No Limit",
        demoGraphics: {
          language: "Language",
          name: "Name",
          dob: "Date of Birth",
          gender: "Gender",
          address: "Address",
          hof: "Family member based Address update",
          document: "Document Update"
        }
      },
      documentDescriptionLinkText: "View Required Valid Documents related to PoI / PoA / PoB for Uploading.",
      proceedToUpdateAadhaar: "Proceed to Update Aadhaar",
      faq: "Have questions?"
    },
    dashboard: "Dashboard",
    hof: {
      title: "Family member based Address update",
      breadcrumbTitle: "Update address using your family member's Aadhaar",
      description: "Proceed with Family member based Address update..",
      howItWorks: {
        step1: "Please enter the Aadhaar number of your Head of Family to fetch the Address from Aadhaar Database. Only Residents who have attained the age of 18 or older can be considered as a HoF.",
        step2: "Please upload the Proof of Relationship (PoR) document that has your Name along with your Head of Family's Name clearly mentioned. Please select HoF's relationship with you, For example if HoF is your husband, select \"Husband\".",
        step3: "You have to pay ₹ 50 (Rupees fifty only) towards the online update fee. You can make the payment through credit/debit card or net banking. This amount is non-refundable.",
        step4: "When your Head of Family logs onto their myAadhaar portal, they will receive a request for address sharing, which they can accept or deny. This option to accept / decline the request by HoF shall be valid for 30 days from the date of creation of the request."
      },
      currentSection: {
        title: "Details of Family member required for update"
      },
      updateSection: {
        forms: {
          hofUid: {
            label: "Enter Aadhaar number of Family member *"
          },
          mobileField: {
            label: "Enter mobile number of Family member *"
          },
          documentUpload: {
            label: "Select Valid Supporting Document Type"
          },
          relationshipDropdown: {
            label: "Select Family member's relation with the applicant *",
            values: {
              father: "Father",
              mother: "Mother",
              husband: "Husband",
              wife: "Wife",
              guardian: "Guardian",
              Others: "Others"
            }
          }
        }
      }
    },
    documentInfoPopup: {
      title: " Please upload a valid document to process your request.",
      identityDocumentInfo: "If the document is for Identity proof, it should be in your name and should have a photograph. Please verify that 'Name' mentioned above in the screen matches 'Name' in document you are uploading.",
      addressDocumentInfo: "If the document is for address proof, it should be in your name. Documents in the name of spouse, guardian, or parents will not be accepted. Please verify that 'Address' mentioned above in the screen matches 'Address' in document you are uploading.",
      close: "Close",
      continueToUpload: "Continue to Upload"
    },
    forms: {
      reUseDocText: "You may reuse the following already uploaded documents.",
      stepper: {
        language: "Language",
        Name: "Name",
        dob: "DOB",
        gender: "Gender",
        address: "Address",
        preview: "Preview",
        payment: "Payment"
      },
      formButtons: {
        back: "Back",
        next: "Next",
        makePayment: "Make Payment",
        retry: "Retry Payment",
        goToDashboard: "Go to Dashboard"
      },
      languageForm: {
        currentSection: {
          title: "Current Local Language Details",
          fields: {
            currentLocalLanguage: "Current Local Language"
          }
        },
        updateSection: {
          title: "Select New Local Language",
          fields: {}
        }
      },
      nameForm: {
        currentSection: {
          title: "Current Details",
          fields: {
            currentName: "Current Name",
            currentLocalName: "Current Name"
          }
        },
        updateSection: {
          title: "Details to be Updated",
          fields: {
            newName: "New Name",
            documentType: "Select Valid Supporting Document Type",
            documentTypeError: "Document type not selected",
            uploadDocumentLabel: "Select Supporting Document",
            clear: "Clear",
            same_data_error: "Updated name and existing name in Aadhaar is same! Please recheck and enter correct name."
          }
        }
      },
      dobForm: {
        currentSection: {
          title: "Current Details",
          fields: {
            currentDOB: "Current Date of Birth"
          }
        },
        updateSection: {
          title: "Details to be Updated",
          fields: {
            newDOB: "New Date Of Birth to be Updated",
            documentType: "Select Valid Supporting Document Type",
            documentTypeError: "Document type not selected",
            uploadDocumentLabel: "Select Supporting Document",
            clear: "Clear"
          }
        },
        confirmationPopUp: {
          heading: "Are you sure you want to change your date of birth to {{- dob}}?",
          description: "Please click on 'Okay' to confirm."
        }
      },
      genderForm: {
        currentSection: {
          title: "Current Details",
          fields: {
            currentGender: "Current Gender"
          }
        },
        updateSection: {
          title: "Details to be Updated",
          fields: {
            newGender: "New Gender to be Updated",
            genderError: "Gender not Selected"
          }
        },
        options: {
          male: "Male",
          female: "Female",
          transgender: "Transgender"
        },
        confirmationPopUp: {
          heading: "Are you sure you want to change your gender to {{gender}}?",
          description: "Please click on 'Okay' to confirm."
        }
      },
      addressForm: {
        currentSection: {
          title: "Current Details",
          fields: {
            currentAddress: "Current Address",
            currentLocalAddress: "Current Address"
          }
        },
        updateSection: {
          title: "Details to be Updated",
          fields: {
            //todo
            careOf: "Care of",
            house: "House/Building/Apartment",
            street: "Street/Road/Lane",
            area: "Area/Locality/Sector",
            landmark: "Landmark",
            pincode: "Pincode",
            village: {
              title: "Village/Town/City",
              errorMsg: "Error in fetching village/town/city",
              nullErrorMsg: "Please select village/town/city"
            },
            postOffice: {
              title: "Post Office",
              errorMsg: "Error in fetching post office",
              nullErrorMsg: "Please select post office"
            },
            district: {
              title: "District",
              errorMsg: "Error in fetching district",
              nullErrorMsg: "Please select district"
            },
            state: {
              title: "State",
              errorMsg: "Error in fetching state",
              nullErrorMsg: "Please select state"
            },
            //untill here
            documentType: "Select Valid Supporting Document Type",
            documentTypeError: "Document type not selected",
            uploadDocumentLabel: "Select Supporting Document",
            clear: "Clear"
          }
        }
      },
      preview: {
        fields: {
          newLanguage: "New Local Language",
          newName: "New Name",
          newDOB: "New Date Of Birth",
          newGender: "New Gender",
          newAddress: "New Address",
          newLocalName: "New Name",
          newLocalGender: "New Gender",
          newLocalAddress: "New Address",
          updateLanguage: "Edit Updated Local Language",
          updateName: "Edit Updated Name",
          updateDOB: "Edit Updated Date Of Birth",
          updateGender: "Edit Updated Gender",
          updateAddress: "Edit Updated Address"
        },
        edit: "Edit",
        supportingDocuments: "Supporting Documents",
        dataFields: "Updated Data Fields",
        transliterationText: "Allow UIDAI to correct any transliteration related inaccuracy which may have occurred.",
        acceptTermsText: "I hereby confirm that I have read the instructions carefully and the information provided by me to the UIDAI is true and correct .",
        acceptTermsText_p1: "I hereby confirm and declare that all the information and documents submitted is correct to the best of my knowledge and belief.",
        acceptTermsText_p2: "I understand that if the above declaration is found to be incorrect, my Aadhaar number may be deactivated and, in addition, action may be taken against me as per law.",
        acceptTermsText_p3: "I understand that the above information may be used, disclosed or shared in accordance with the Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016 and regulations made thereunder.",
        acceptTermsText_p4: "I hereby give my consent for electronically obtaining information evidencing proof of identity, address, birth and/or relationship from the databases of the authorities dealing with the preparation or maintenance of such information and for sharing the above information and documents with government agencies and/or any such authority, for the purpose of verification.",
        acceptTermsText_p5: "I hereby agree with the Declaration.",
        //todo
        errorPop: {
          error: "Error!",
          close: "Close"
        }
      }
    },
    payment: {
      paymentOptions: {
        text: "Please select a payment option"
      },
      makePayment: {
        welcomeText: "Dear requestor,",
        documentPaymentInfo: "You will be charged Rs. {{paymentAmount}} to process the Document Update request.",
        paymentInfo: "You will be charged Rs. {{paymentAmount}} to process the online update request.",
        linkText: "You can find more information on the Payments / Cancellation / Refunds Process here.",
        acceptTerms: "I hereby confirm that I have read and understood the Payments / Cancellation / Refunds Process.",
        poweredBy: "Powered By",
        popUp: {
          title: "Payment Policy",
          payment: {
            title: "Payment for Online Update Request",
            p1: "● We charge Rs 50.00 for our online update service. Rs 50 is charged irrespective of the number of demographic fields selected for update.",
            p2: "● For payment, we will redirect you to our payment gateway i.e. PayUBiz portal. You can use net-banking, Debit/Credit Card, UPI, or other available online instruments to make the payment."
          },
          cancel: {
            title: "Cancellation of Online Update Request",
            p1: "● A resident can cancel his update request until it is reviewed by our backend operators. On successful cancellation of request, we refund the total amount i.e Rs 50.00."
          },
          refund: {
            title: "Refund Policy",
            p1: " ● We refund the total amount i.e. Rs 50.00 for successfully canceled update requests.",
            p2: "● In case you encounter an error while attempting payment at our payment gateway, we reconcile your transaction details with the payment gateway. If we find that money has been deducted from your bank account/credit/debit card, we initiate the refund for the total amount.",
            p3: "● Our refund process may take any time between a few hours to 21days."
          }
        }
      },
      paymentStatus: {
        transactionStatus: "Transaction Status",
        reason: "Reason",
        dateAndTime: "Payment Date & Time",
        amount: "Amount",
        failed: "Failed",
        success: "Success",
        downloadAckText: "Download Acknowledgement"
      },
      paymentPopup: {
        estTime: "Estimated Time",
        description: "Please wait while we complete the transaction and generate the acknowledge slip."
      }
    }
  },
  myHofRequests: {
    title: "Family member requests",
    description: "Check family member based Address Sharing Requests",
    forms: {
      title: "Please type SRN and Fetch request to respond",
      label: "Enter SRN",
      buttons: {
        decline: "Decline",
        accept: "Accept"
      },
      displayMsg: {
        case1: "Dear Aadhaar Holder,<br/><br/>You have received a request from {{resident}} to use the address available on your Aadhaar. {{resident}} has indicated you as their {{relType}}.<br/><br/>Your name will appear in the address of {{resident}} as given below.<hr style='margin: 15px 0';/>{{address}}",
        case2: "You Have Approved to share your Address with {{resident}}.",
        case3: "You Have Declined to share your Address with {{resident}}.",
        case4: "No Request Found on Above SRN."
      },
      acceptScreen: {
        acceptMsg: "You have accepted the request as a family member sharing your address.",
        declineMsg: "You have rejected the request as a family member sharing your address."
      },
      confirmationPopUp: {
        rejectPrompt: "Please confirm that you would like to reject the request to share your address.",
        acceptPrompt: "Please confirm your consent to share your address."
      }
    }
  },
  pvc: {
    oauth: {
      preview: {
        sectionHeading: "Please preview your demographic details before placing order for Aadhaar PVC card",
        sectionText: "In case you find any inaccuracy/missing/old/outdated information with your Aadhaar, you may opt to update your Aadhaar first by visiting the nearest Aadhaar Seva Kendra or accessing the Update Aadhaar Data option from this portal",
        name: "Name",
        dob: "Date Of Birth",
        gender: "Gender",
        address: "Address"
      }
    },
    makePayment: {
      popUp: {
        title: "PAYMENT / CANCELLATION / REFUND POLICY",
        payment: {
          title: "Payment for Online Update and PVC Card Request",
          documentTitle: "Payment for Document Update",
          p1: "● We charge <b>₹ 75.00</b> for our online update service. <b>₹ 75.00</b> is charged irrespective of the number of demographic fields selected for update.",
          p2: "● UIDAI charges <b>₹ 75.00</b> (including taxes) for Aadhaar PVC card. The charge includes the cost of the card and delivery through Speed Post service of India Post at the registered address of the resident in Aadhaar database",
          p3: "● For making payment, you will be redirected to UIDAI payment gateway. You can use Netbanking, Debit/Credit Card, UPI, or other available online options to make the payment.",
          p4: "● A nominal charge of <b>₹ 0.00</b> to be paid for the services, which is <b>non-refundable</b>."
        },
        cancel: {
          title1: "Cancellation of Online Update Request",
          p1: "● A resident can only cancel her/his update request <b>until it is reviewed by our backend operators</b>. On successful cancellation of request, we would refund the total amount i.e <b>₹ 75.00</b>."
        },
        refund: {
          title: "Refund Policy",
          p1: "● We would refund the total amount i.e. <b>₹ 75.00</b> only for canceled “online update requests”.",
          p2: "● UIDAI would refund the total amount i.e. <b>₹ 75.00</b> in case your request for Aadhaar PVC card is not processed due to any technical reasons.",
          p3: "● In case you encounter any error during payment, our backend process would reconcile your transaction with the payment gateway to find out the status.",
          p4: "● If money has been deducted from your bank account/credit/debit card but does not reflect on the order confirmation page, our reconciliation process would verify the same and provide the correct status of the payment.",
          p5: "● If you have not attempted the “Payment Retry” option, we will reconcile the transaction for “Successful” status, then we will process your request.",
          p6: "● If you have attempted the “Payment Retry” option and completed the payment successfully, your previous transaction(s) would be reconciled. For successful duplicate transactions, a refund would be initiated.",
          p7: "● Our refund process may take any time between 24 hours to 10 working days."
        }
      }
    },
    generic: {
      form: {
        typeSelectLabel: "Order PVC card for",
        selectLabel: "Select 12 Digit Aadhaar Number/ 28 digit Enrolment ID/ SID",
        //selectLabel: "Select 12 Digit Aadhaar Number/ 28 digit Enrolment ID",
        radioLabels: {
          uid: "Aadhaar Number",
          eid: "Enrolment ID Number",
          sid: "SID",
          self: "Self",
          other: "Others"
        },
        textFields: {
          uid: "Enter Aadhaar Number",
          recepientUid: "Enter recipient's Aadhaar Number",
          eid: "Enter 14 digit Enrolment Number",
          sid: "Enter 28 digit SID Number",
          generic: "Enter Enrolment ID, SRN or URN",
          mobile: "Enter Mobile Number",
          recipientMobile: "Enter recipient/requestor mobile number",
          otp: "Enter OTP",
          code: "Enter Verification Code",
          securityCode: "Enter Captcha"
        },
        checkBox: {
          mobile: "My mobile number is not registered",
          tnc: "Terms and conditions"
        },
        button: {
          otp: "Send OTP",
          submit: "Submit"
        },
        modal: {
          mobile: "If your Aadhaar is registered with mobile number, we would encourage you to login to myAadhaar (myaadhaar.uidai.gov.in) and place the order for PVC card.",
          tnc: {
            heading: "Please find below the approved 'Terms & Conditions' to be updated in OAC portal: ",
            t1: "I hereby give my consent for printing of my Aadhaar PVC card.",
            t2: "I understand that my printed Aadhaar PVC card will be delivered at my address, registered with Aadhaar which is complete and correct with Pincode.",
            t3: "I hereby agree to pay Rs 75/- (Incl GST) for Order Aadhaar PVC card service.",
            t4: "I understand that Aadhaar PVC card will be delivered by SPEED POST service of India Post in line with their delivery norms. Delivery status may be tracked using India Post Status Tracking services."
          }
        },
        note: {
          title: "Disclaimer:",
          content: {
            p1: "● The requested Aadhaar PVC card will be delivered on the registered address on that PVC Card.",
            p2: "● Demographic details cannot be disclosed at this stage.",
            p3: "● The ordered PVC Card will have the latest demographic information available in the Aadhaar database."
          }
        },
        othersTC: {
          title: "Terms and Conditions",
          content: {
            p1: "Ordering of Aadhaar PVC Card is being made with the full knowledge and consent of the Aadhaar number holder(ANH).",
            p2: "ANH is aware that the ordered Aadhaar PVC card will be delivered at the registered Address of ANH.",
            p3: "ANH hereby agrees to pay Rs 75/- (incl GST) for this paid Aadhaar PVC card Service of UIDAI.",
            p4: "I understand that the Aadhaar PVC card will be delivered using SPEED POST Service of Department of Post (DoP) in line with DoP delivery norms and Delivery Status may be trackedusing DoP Status Track Services."
          },
          para: "I understand that unauthorised use of another individual’s Aadhaar number or personal information, is an offence under the Aadhaar Act, 2016 and may attract penalties and/or legal action. By proceeding, I confirm that the Aadhaar details entered belong to the intended ANH and that I am authorized to place this request on his/her behalf."
        },
        selfTC: {
          title: "Terms and Conditions",
          content: {
            p1: "Ordering of Aadhaar PVC Card is being made with the full knowledge and consent of Aadhaar Number Holder (ANH).",
            p2: "ANH is aware that the ordered Aadhaar PVC card will be delivered at the registered Address of ANH.",
            p3: "ANH hereby agrees to pay Rs 75/- (incl GST) for this paid Aadhaar PVC card Service of UIDAI.",
            p4: "I understand that the Aadhaar PVC card will be delivered using SPEED POST Service of Department of Post (DoP) in line with DoP delivery norms and Delivery Status may be tracked using DoP Status Track Services."
          }
        }
      },
      payment: {
        welcomeText: "Dear Resident,",
        srnInfo: "Your request has been registered with SRN #",
        trackInfo: "Please use this number for order tracking and correspondence with UIDAI.",
        paymentText: "You would be charged Rs 75/-(inclusive of GST & Speed post charges) for the PVC Aadhaar card.",
        redirectInfo: "On clicking Make Payment button, you will be redirected to PayU Payment Gateway for online payment. On successful payment, you would be redirected back to this page for download of the Acknowledgement Slip. In case the payment fails, you can retry the payment multiple times.",
        button: {
          cancel: "Cancel",
          makePayment: "Make Payment"
        }
      }
    },
    status: {
      description: "Use this page to check the status of the new SRNs, starting with 'S' and issued by myaadhaar portal. Status of SRNs starting with number and originated with older portal are to be checked at https://resident.uidai.gov.in/check-reprint-status",
      srnField: "Enter SRN",
      table: {
        srn: "SRN",
        orderDate: "Order Date",
        currentStatus: "Current Status",
        awb: "Air Way Bill Number",
        dispatchDate: "Date of Dispatch",
        awb_subText: "You can track your order at 'www.indiapost.gov.in' using above number",
        demographic: "For security reasons, complete demographic details of the Aadhaar number holder are hidden here. However, your PVC card will be shipped with complete and latest demographics information."
      }
    }
  },
  aadharStatus: {
    title: "Check Enrolment or Update Status",
    description: {
      one: "Check if your Aadhaar is generated or updated.",
      // two: "You will require EID (Enrolment ID), SRN or URN to check your Aadhaar Status. The EID is displayed on the top of your enrolment/update acknowledgement slip and contains 14 digit enrolment number (1234/12345/12345) and the 14 digit date and time (yyyy/mm/dd hh:mm:ss) of enrolment. These 28 digits together form your Enrolment ID (EID).",
      twoEID: "The 14 digit enrolment number, printed on acknowledgement slip while physically visiting Enrolment / Update center. Sample: 1234/12345/12345",
      twoSRN: "‘S’ followed by 13 digits, printed on acknowledgement slip while submitting online update request. Sample: S1234567891234",
      twoURN: "The 8 digit URN, printed on acknowledgement slip while submitting update request through ‘mAadhaar’ application. Sample: 12345678",
      twoSID: "‘S’ followed by 27 digits, printed on acknowledgement slip while physically visiting Enrolment / Update center. Sample: S123456789123456789123456789",
      three: `In case if you lost EID you can retrieve lost or forgotten EID by your registered mobile number or email ID. <a href="/retrieve-eid-uid" class="click_here">Click here</a> to Retrieve EID`
    },
    optionalMessage: "Mention date and time as per the acknowledgement slip (<b>optional</b>)",
    withoutoptionalMessage: "Mention date and time as per the acknowledgement slip",
    holdMessage: "We're experiencing a delay in processing your request. As and when the issue is resolved and the request is processed, we will communicate the progress. Inconvenience caused is deeply regretted."
  },
  complaintStatus: {
    title: "Check Grievance / Feedback Status",
    form: {
      complaintNumber: "Enter Service Request Number",
      QRCid: "Qrc Id",
      status: "Status",
      ComplaintNumber: "Grievance / Feedback Number",
      ResolutionResponse: "Resolution Response"
    }
  },
  fileComplaint: {
    Authform: {
      updateMode: "Mode*",
      Online: "Online",
      Offline: "Offline",
      mAadhaarApp: "mAadhaar mobile app",
      srn: "Enter 14 digit ID starting with S13 or S22",
      eid: "Enter 28 digit ID",
      urn: "Enter 8 digit URN"
    },
    title: "Grievance and Feedback",
    description: "Click here to file your grievance and feedback",
    disclaimer: "Aadhaar, as the most commonly used digital identity, is used to avail of numerous subsidies, benefits and services. In view of the same, for maintaining the accuracy of the Aadhaar database, UIDAI had initiated an exercise for update of documents and Aadhaar information. In the course of activities undertaken to keep the Aadhaar database updated, intimations are issued from time to time to Aadhaar number holders. In this connection, it is clarified that no Aadhaar number has been cancelled. In case any Aadhaar number holder has any grievance in this regard, they may submit their feedback here. Any such grievance will be duly addressed.",
    form: {
      heading: "Please enter required details",
      state: "Enter State",
      enquirer: "Grievance / Feedback For (Self/Others)",
      complaintType: "Enter Grievance / Feedback Type",
      categoryType: "Enter Category Type",
      uploadDocumentLabel: "Select Supporting Document (if any)",
      statusField: "Enter EID / URN",
      placeholder: "Dear Resident, you are requested to provide {{fields}}, to resolve your concern effectively.",
      error: {
        complaintType: "Grievance / Feedback type not selected",
        categoryType: "Category not selected",
        state: "State not selected",
        enquirer: "Enquirer Type not selected"
      }
    },
    Complaintnote: "It is strongly advised to select the right Grievance / Feedback Type for quick resolution of your grievance. Selection of wrong Grievance / Feedback Type may lead to delay in Processing or Cancellation of your request",
    Categorynote: "It is strongly advised to select the right Category Type for quick resolution of your grievance. Selection of wrong Category type may lead to delay in Processing or Cancellation of your request",
    feedbackTextArea: " Please share your feedback",
    feedback: "Please share your experience while filing your Grievance / Feedback by rating below"
  },
  page404: {
    error: "ERROR",
    pageNotFound: "PAGE NOT FOUND",
    btnText: "Visit UIDAI website for Aadhaar related information"
  },
  errorMessages: {
    slipApiFailed: "We're unable to proceed due to an error in generating acknowledgement slip. Please retry after sometime.",
    exisitingDraft: "You already have an active draft from the previous interaction with the portal. You may edit the draft request or cancel it and start afresh.",
    fetchingRequests: "Please wait while we fetch your previous requests from the database.",
    fetchApiFailed: "Couldn't fetch user request data. Something went wrong.",
    fetchApiFailed1: "Something went wrong while fetching requests.",
    fetchApiFailed2: "No Record Found.",
    documentPOAApiFailed: "Couldn't get list of POA documents. Something went wrong.",
    documentPOBApiFailed: "Couldn't get list of POB documents. Something went wrong.",
    documentPOIApiFailed: "Couldn't get list of POI documents. Something went wrong.",
    oauthFailure: "Something went wrong.",
    oauthFailure1: "Invalid Token.",
    technicalError1: "We couldn't complete your request due to temporary errors in accessing our backend services. You will be redirected to the main dashboard to resume the process.",
    technicalError2: "We couldn't complete your request due to temporary errors in accessing our backend services.",
    technicalErrorGriveance: "We're currently experiencing technical difficulties. We apologize for any inconvenience. You're requested to contact our helpline 1947 for assistance.",
    sessionExpired: "Session Expired! You'll be redirected to login page. Please login again.",
    requestDeleted: "Request cancelled successfully!"
  },
  popUpActions: {
    okay: "Okay",
    cancel: "Cancel",
    later: "Later",
    raiseGrievance: "Raise Grievance",
    copyCode: "Copy code",
    ok: "OK",
    close: "Close",
    yes: "Yes",
    no: "No",
    accept: "Accept"
  },
  eaadhaarDownload: {
    title: "e-Aadhaar Download",
    stepper: {
      preview: "Preview",
      download: "Download"
    },
    sectionTite: "Review your Demographics Data",
    description: 'If you wish to correct or update any of the demographics data, please visit "Update Aadhaar Online" section or nearest Aadhaar Seva Kendra.',
    fields: {
      eName: "Name",
      eAddress: "Address",
      name: "Name",
      address: "Address",
      dob: "Date of Birth",
      gender: "Gender"
    },
    btns: {
      download: "Download",
      goToDashboard: "Go to Dashboard",
      retry: "Retry Download"
    },
    successPage: {
      congratulation: "Congratulations !!!",
      successText: "Your e-Aadhaar has been successfully downloaded",
      descriptionTextOne: "Your e-Aadhaar password will be of 7/8 characters in length.",
      descriptionTextTwo: "If your name contains more than 3 letters, your e-Aadhaar password will be a combination of the first four letters of your name followed by the year of birth.",
      descriptionTextThree: "If your name contains only 3 letters, your e-Aadhaar password will be a combination of the first three letters of your name followed by the year of birth.",
      example: "Example",
      exampleTextOne: "1. If your name is ANISH Y KUMAR and your Year of Birth is 1989, then your e-Aadhaar password will be ANIS1989",
      exampleTextTwo: "2. If your name if RIA and your Year of Birth is 1989, then your e-Aadhaar password will be RIA1989 ",
      exampleTextThree: "3. If your name is JOY CHATTERJEE and your Year of Birth is 1989, then your e-Aadhaar password will be JOYC1989",
      exampleTextFour: "4. If your name is D'SOUZA ALEX and your Year of Birth is 1989, then your e-Aadhaar password will be DSOU1989",
      exampleTextFive: "5. If your name is R.P.Singh and your Year of Birth is 1989, then your e-Aadhaar password will be RPSI1989",
      infoDigital: {
        title: "Verification of the Digital Signature",
        description: "To successfully validate the digital signature on e-Aadhaar and see the 'green tick' in the PDF, we recommend that you download and open it in the latest version of Adobe Acrobat Reader on Microsoft Windows or MacOS.",
        description2: "If the signature still shows a warning or question mark, you may need to manually add the signing certificate to your trusted identities.",
        description3: "Instructions on how to do this can be found on the Adobe Help website: ",
        link: "https://helpx.adobe.com/acrobat/using/trusted-identities.html"
      }
    }
  },
  unauthEaadhaarDownload: {
    title: "e-Aadhaar Download",
    selectLabel: "Select 12 digit Aadhaar Number /16 digit Virtual ID (VID) Number / 28 digit Enrolment ID (EID) Number / 28 digit Service ID (SID) Number.",
    radioLabels: {
      uid: "Aadhaar Number",
      eid: "Enrolment ID Number",
      vid: "Virtual ID Number",
      sid: "SID"
    },
    textFields: {
      uid: "Enter Aadhaar Number",
      eid: "Enter 14 digit Enrolment Number",
      vid: "Enter Virtual ID Number",
      eid_sid: "Enter 14 / 28 digit Enrolment Number",
      sid: "Enter 'S' followed by 27 digit number",
      otp: "Enter OTP",
      securityCode: "Enter Captcha",
      date: "Select date",
      time: "Select time",
      srnInfo: "Enter SRN",
      urnInfo: "Enter 8 digit URN Number",
      sidInfo: "Enter 'S' followed by 27 digit number"
    },
    checkBox: {
      mask: "Do you want a masked Aadhaar?"
    },
    button: {
      otp: "Send OTP",
      submit: "Verify & Download"
    },
    messages: {
      otp: "OTP generated successfully!",
      otp2: "OTP successfully dispatched to your Aadhaar registered mobile number"
    }
  },
  vidGeneration: {
    title: "Generate / Retrieve Virtual ID",
    btnText: "Verify and Proceed",
    btnText2: "Next",
    response: {
      successText: {
        part1: "Your Virtual ID(VID) ",
        part2: "has been sent your Aadhaar registered mobile number"
      },
      subText: "In case you have changed your mobile number or wish to change your registered Email you are required to get it updated in your Aadhaar as soon as possible."
    },
    radio: {
      title: "Please Select",
      gvid: "Generate VID",
      rvid: "Retrieve VID"
    }
  },
  retrieveEID: {
    generic: {
      form: {
        separator: "OR",
        textFields: {
          name: "Enter Name as per Aadhaar",
          dob: "Enter Date of Birth",
          email: "Enter Email Address"
        },
        radioLabels: {
          uid: "Aadhaar Number",
          eid_sid: "Enrolment ID Number / SID "
          // sid: "SID"
        }
      },
      status: {
        eid: {
          mobileNumber: "Your Enrolment ID(EID) {{eid}} is sent to your registered mobile number.",
          email: "Your Enrolment ID(EID) {{eid}} is sent to your registered email address."
        },
        uid: {
          mobileNumber: "Your Aadhaar number {{uid}} is sent to your registered mobile number.",
          email: "Your Aadhaar number {{uid}} is sent to your registered email address."
        },
        sid: {
          mobileNumber: "Your Service Identity Number(SID) {{eid}} is sent to your registered mobile number.",
          email: "Your Service Identity Number(SID) {{eid}} is sent to your registered email address."
        }
      }
    }
  },
  checkAadhaarValidity: {
    title: "Check Aadhaar Status",
    btnText: "Proceed",
    responsePage: {
      dataFields: {
        ageBand: "Age Band",
        gender: "Gender",
        state: "State",
        mobile: "Mobile",
        years: "years"
      },
      status: {
        exists: "Exists",
        notExists: "doesn't Exists",
        suspended: {
          main: "Suspended",
          part1: "Aadhaar number",
          part2: "has been deactivated under regulation 28 of the Aadhaar (Enrolment & Update) Regulations, 2016"
        },
        cancelled: {
          main: "Cancelled",
          part1: "Aadhaar number",
          part2: "has been cancelled under regulation 27 of the Aadhaar (Enrolment & Update) Regulations, 2016"
        }
      },
      aadhaar: "Aadhaar Number",
      descText: "Aadhaar Verification Completed"
    }
  },
  orderPVC: {
    title: "Order Aadhaar PVC Card"
  },
  offlineEkyc: {
    title: "Download Offline e-KYC",
    title1: "Create a Share Code of 4 Digits",
    title2: "Congratulations!!",
    stepper: {
      setCode: "Set Code",
      download: "Download"
    },
    button: {
      back: "Back",
      download: "Download",
      goToDashboard: "Go to Dashboard"
    },
    invalidShareCode: "Invalid Share Code! Please retry with correct share code.",
    shareCode: {
      title: "Create a Share Code",
      descText: "A ZIP file containing your e-KYC will be password protected using the above Share Code. Upon clicking Download, the file will be downloaded into your device / desktop.",
      placeholderText: "4 - Digits Share Code to be Created"
    },
    success: {
      desc: "To avail the service please share the",
      p1: "ZIP file",
      p2: "Share Code",
      p3: "Registered Mobile Number with the service provider",
      summary: "This will provide Offline Aadhaar Verification facility to service providers / Offline Verification Seeking Entity (OVSE) without the need to collect or store Aadhaar number."
    },
    descTextStep1: "Aadhaar Paperless Offline e-KYC is a secure and shareable document which can be used by any Aadhaar holder for offline verification of identification. The details will contain Name, Address, Photo, Gender, DoB, hash of registered Mobile Number, hash of registered Email Address and reference id which contains last 4 digits of Aadhaar Number followed by time stamp in a digitally signed XML.",
    descTextStep2: "Your ZIP file for Offline e-KYC has been successfully downloaded to the default downloads folder"
  },
  lockUnlockBiometrics: {
    serviceCard: {
      errorMessage: "Please wait while we fetch current lock/unlock status."
    },
    howItWorks: {
      title: "Lock/Unlock Biometrics",
      description: "Biometrics lock/unlock feature prevents possible misuse of the resident’s biometrics data. Locked biometrics prevents the use of biometrics information for authentications. Users of this service are cautioned to do so with care to prevent denial of authentication services.",
      infoData: {
        stepOneDescription: " Please use this service from the Dashboard to lock your biometrics. When you lock  your biometrics (fingerprint, iris, and face)  they can no longer be used for authentication. However, OTP-based authentication would continue to be available as needed.",
        stepTwoDescription: " Please return to this page and proceed to Unlock Biometrics. Upon Unlocking Your Biometrics ( Fingerprint + Iris + Face ) will be enabled along with OTP based Authentication."
      }
    },
    selectionScreen: {
      unlockCard: {
        heading: "Please Select To Unlock",
        unlockInfo: "You can carry out biometric authentication by using face, finger or iris on app.",
        consentText: "I Understand that after unlocking my biometric, I will be able to perform biometric authentication.",
        label: "Your biometrics are currently locked!"
      },
      lockCard: {
        heading: "Please Select To Lock",
        lockInfo: "You cannot carry out biometric authentication by using face, finger or iris on app.",
        consentText: "I Understand that after locking my biometric, I will not be able to perform biometric authentication until I unlock it again.",
        label: "Your biometrics are currently unlocked!"
      },
      selectOptionError: "Kindly select only one option.",
      unlockInfo: "You can unlock your biometrics temporarily for 10 minutes.",
      selectButton: {
        tempUnlock: "Unlock Biometrics Temporarily",
        tempUnlockInfo: "For Short Time Duration",
        unlock: "Unlock Biometrics Permanently",
        unlockInfo: "Until Next Time You Lock"
      }
    },
    successScreen: {
      tempUnlockMessage: "If you want to permanently unlock, please revisit this service from dashboard."
    }
  },
  lockUnlockAadhaar: {
    howItWorks: {
      title: "Lock / Unlock Aadhaar",
      infoData: {
        stepOneLabel: "Step 1 of 3: ",
        stepOneDescription: "Before proceeding to Lock / Unlock Aadhaar, please generate a 16-digit Virtual ID (VID), as only VID has the ability to Lock / Unlock Aadhaar. You can generate your VID using the Generate / Retrieve Virtual ID service from the Dashboard or by sending an SMS to 1947. RVID [last 4 or 8 digits of UID] {ex: RVID 1234}. ",
        stepOneLinkText: "Click Here to Generate / Retrieve VID",
        stepTwoLabel: "Step 2 of 3: ",
        stepTwoDescription: "Once your VID has been generated, please return to this page and proceed to lock your Aadhaar with your VID, then authenticate with your VID whenever necessary, as using your Aadhaar number for authentication will be disabled once locked.",
        stepThreeLabel: "Step 3 of 3: ",
        stepThreeDescription: "Please return to this page and proceed to Unlock Aadhaar; only VID has the ability to Unlock Aadhaar, while Unlocking Aadhaar also permits Aadhaar Number-based authentication."
      }
    },
    formScreen: {
      title: "Please enter required details to Lock/Unlock Aadhaar",
      radioLabels: {
        lockAadhaar: "Lock Aadhaar",
        unlockAadhaar: "Unlock Aadhaar"
      },
      consent: {
        lockConsent: "I Understand that after locking my Aadhaar, I will be able to perform authentication using only Virtual ID (VID) and not Aadhaar Number.",
        unlockConsent: "I Understand that after unlocking my Aadhaar, I will be able to perform authentication using both Virtual ID (VID) and Aadhaar Number."
      },
      textFields: {
        name: "Enter Full Name",
        pincode: "Enter Pincode"
      }
    },
    FAQ: [{
      heading: "What is Aadhaar (UID) Lock & Unlock?",
      description: "For a resident, security and privacy of personal data is always a primary concern. To strengthen the security of his/her Aadhaar number and to provide control to the resident, UIDAI provide a mechanism of locking and unlocking Aadhaar number (UID).\nResident can lock his or her Aadhaar (UID) via UIDAI website <a href='www.myaadhaar.uidai.gov.in' target='_blank'> www.myaadhaar.uidai.gov.in </a>.\nBy doing this Resident cannot perform any sort of Authentication using UID, UID Token & VID for Biometrics, Demographic & OTP modality.\nIf resident wants to unlock UID he/she can do so by using latest VID, through UIDAI website.\nAfter unlocking Aadhaar (UID), resident can perform authentication using UID, UID Token & VID."
    }, {
      heading: "How can resident Lock UID?",
      description: "For Locking UID, Resident should have 16 digit VID number and it's a pre-requisite for locking. If resident don't have VID, it can be  generated via SMS Service or UIDAI website <a href='https://myaadhaar.uidai.gov.in/' target='_blank'>(https://myaadhaar.uidai.gov.in/).</a>\nSMS Service. GVID space last 4 or 8 digit of UID. SMS to 1947.Ex-GVID 1234.\nResident may visit UIDAI website <a href='https://uidai.gov.in/' target='_blank'>https://uidai.gov.in/</a>.\n Under My Aadhaar tab, Click on Aadhaar Lock & Unlock services. Select UID Lock Radio Button and enter UID Number, Full Name, and Pin Code as in latest details and enter Security code. Click on Send OTP and click on submit. Your UID will be locked successfully."
    }, {
      heading: "How can resident Unlock UID?",
      description: "For Unlocking UID resident should have latest 16 digit VID and if resident forgot 16 digit VID he can retrieve latest VID through SMS services.\nRVID Space last 4 or 8 digit of UID. SMS to 1947. Ex- RVID 1234\nTo unlock UID, resident may visit UIDAI website <a href=' https://uidai.gov.in/ ' target='_blank'> https://uidai.gov.in/</a>, select Unlock radio button, Enter Latest VID and security Code and click on send OTP and click on Submit. Your UID will be unlocked successfully.."
    }, {
      heading: "Why should I lock my Aadhaar?",
      description: "Locking Aadhaar adds an extra layer of security. Once locked, Aadhaar-based authentication using UID, VID or UID Token cannot be performed until it is unlocked by the resident."
    }, {
      heading: "When should I consider locking my Aadhaar?",
      description: "Residents who do not frequently use Aadhaar-based authentication or who wish to enhance the security of their Aadhaar may choose to lock their Aadhaar."
    }, {
      heading: "Can I lock my Aadhaar permanently?",
      description: "Aadhaar remains locked until the Aadhaar Holder chooses to unlock it using the latest VID. There is no automatic expiry of the lock."
    }, {
      heading: "Will locking Aadhaar affect my Aadhaar number or demographic details?",
      description: "No. Locking Aadhaar does not affect the Aadhaar number or any demographic information such as name, address, date of birth, or mobile number."
    }, {
      heading: "Can I still download my e-Aadhaar when my Aadhaar is locked?",
      description: "Yes. If the resident had already logged into the Aadhaar App prior to locking Aadhaar, he/she can still download e-Aadhaar through the app. Locking Aadhaar only restricts Aadhaar-based authentication. Residents can continue to access Aadhaar services that do not require Aadhaar authentication."
    }, {
      heading: "What happens if someone tries to authenticate using my Aadhaar when it is locked?",
      description: "Authentication requests using the locked Aadhaar (UID), UID Token, or VID will not be successful until the Aadhaar is unlocked."
    }, {
      heading: "Do I need a registered mobile number to lock or unlock my Aadhaar?",
      description: "Yes. A mobile number registered with Aadhaar is required to receive OTPs and access the Aadhaar Lock/Unlock service."
    }, {
      heading: "Is there any fee for locking or unlocking Aadhaar?",
      description: "No. The Aadhaar Lock/Unlock service is provided free of cost by UIDAI."
    }, {
      heading: "Can I lock and unlock my Aadhaar multiple times?",
      description: "Yes. Residents can lock and unlock their Aadhaar as many times as required."
    }, {
      heading: "Will locking Aadhaar affect my ability to receive government benefits or subsidies?",
      description: "Aadhaar lock only restricts Aadhaar authentication. If Aadhaar authentication is required for availing a service, the resident may need to unlock Aadhaar before proceeding."
    }, {
      heading: "Can I unlock my Aadhaar temporarily for a single authentication?",
      description: "Aadhaar remains unlocked until the Aadhaar Holder chooses to lock it again. Aadhaar Holder may again lock his/her Aadhaar after completing the required authentication."
    }, {
      heading: "How will I know whether my Aadhaar is currently locked or unlocked?",
      description: "Residents can check the status of their Aadhaar through the Aadhaar Lock/Unlock service available on the myAadhaar portal."
    }, {
      heading: "Can I lock my Aadhaar if I have not generated a VID?",
      description: "No. A valid 16-digit VID is required before Aadhaar can be locked."
    }, {
      heading: "Is Aadhaar lock different from Biometric Lock?",
      description: "Yes. Aadhaar Lock restricts all Aadhaar-based authentication using UID, UID Token, and VID. Biometric Lock specifically blocks the use of biometric authentication (fingerprint iris and face authentication) while allowing other authentication modes as applicable."
    }]
  },
  verifyEmailMobile: {
    desc: "Please Enter Required Details to Check Email / Mobile Link",
    verifyMobile: "Check Mobile Link",
    verifyEmail: "Check Email Link",
    verifyEmailMobile: "Check Email / Mobile Link"
  },
  aadharUpdateHistory: {
    title1: "Check your Aadhaar Update History",
    label1: "Record",
    label2: "Date of Enrolment/Update",
    label3: "URN/EID ",
    label4: "Type",
    list1: "Name",
    list2: "Mobile",
    list3: "Email",
    list4: "DOB",
    list5: "Gender",
    list6: "Address"
  },
  bankLinkingStatus: {
    sectionTitle: "Check Aadhaar Bank Linking Status",
    aadhaarNumber: "Aadhaar Number",
    bankLinkingStatus: "Bank Linking Status",
    active: "Active",
    inactive: "Inactive",
    prevBankDetails: "Previous Bank Linking Details",
    lastUpdatedDate: "Last Updated Date",
    failureMessage: "No Bank mapping record found for this Aadhaar number",
    successMessage: "Your Aadhaar-Bank Mapping has been done",
    disclaimer: "Aadhaar Linking status is fetched from NPCI Server. Under any circumstance, UIDAI shall not be responsible or liable for the correctness of the displayed status. Further, UIDAI is not storing any information fetched from NPCI server.",
    noRecordsAvailable: "No Records Available",
    checkWithBank: "Please check with your Bank to get your Aadhaar Number linked to your Bank Account"
  },
  bankSeedingStatus: {
    AadhaarNumber: "Aadhaar Number",
    BankName: "Bank Name",
    BankSeedingStatus: "Bank Seeding Status",
    LastUpdatedDate: "Last Updated Date",
    noRecordAlert: "Please check with your Bank to get your Aadhaar Number linked to your Bank Account",
    note: "The information provided through the link is fetched from the server of National Payment Corporation of India (NPCI). UIDAI is not responsible for its correctness. The information fetched is not stored by UIDAI.",
    ActiveText: "Active",
    InactiveText: "Inactive"
  },
  FAQ: {
    checkAadhaarPvcCardOrderStatus: [{
      question: "What are the different forms of Aadhaar?",
      answer: "The different forms of Aadhaar are Aadhaar Letter, Aadhaar PVC card, eAadhaar and mAadhaar which are equally valid and acceptable."
    }, {
      question: "Can I choose to have and use any form of Aadhaar?",
      answer: "Yes"
    }, {
      question: "What is \u201COrder Aadhaar PVC Card\u201D service?",
      answer: "\u201COrder Aadhaar PVC Card\u201D is an online service which facilitates the Aadhaar holder to get their Aadhaar details printed on PVC Card by paying nominal charges."
    }, {
      question: "What are the security features of \u201CAadhaar PVC Card\u201D?",
      answer: "Aadhaar PVC Card contains security features like:\n Tamper proof QR Code \n Micro text\n Ghost image\n Issue Date & Print Date\n Guilloche Pattern\n Embossed Aadhaar Logo"
    }, {
      question: "What are the charges to be paid for \u201CAadhaar PVC Card\u201D?",
      answer: "Charges to be paid for Aadhaar PVC Card are Rs.75/- (Inclusive of GST & speed post charges)."
    }, {
      question: "How one can raise the request for \u201CAadhaar PVC Card\u201D?",
      answer: "The facility can be availed by visiting <a href='https://myaadhaar.uidai.gov.in' target='_blank'> https://myaadhaar.uidai.gov.in</a> or mAadhaar App. \n <b>Using myAadhaar Portal:</b> Aadhaar Number Holder (ANH) with registered mobile number can login by entering 12-digit Aadhaar Number (UID) and order Aadhaar PVC Card by following the instructions provided on screen and paying applicable charges./n ANH whose mobile number is registered with Aadhaar can order Aadhaar PVC Cards for Self or Others. \n <b>Using mAadhaar mobile app:</b> ANH whose mobile number is registered in Aadhaar can Order Aadhaar PVC Card using mAadhaar App for self & for other ANHs added in the profile having their  mobile number registered with Aadhaar. <br/> After successful payment, receipt will get generated containing SRN and transanction details. SRN is also shared via SMS."
    }, {
      question: "Which modes are available to make the payment?",
      answer: "Presently, following online payment modes are available for making payment:-\nCredit Card\nDebit Card\nNet Banking\nUPI\nWallet\nUPIPPI\nUPICLI"
    }, {
      question: "What is SRN?",
      answer: "SRN is 14 digits Service Request Number which is generated while raising request for Aadhaar PVC Card."
    }, {
      question: "What is AWB number?",
      answer: "Airway Bill Number(AWB) is the tracking number generated by Department of Posts to track the delivery of Aadhaar PVC Card through India Post website."
    }, {
      question: "What if residents want to get the Aadhaar PVC Card printed with the details that they want?",
      answer: "If residents want some changes in the details to be printed on Aadhaar PVC Card,  they first need to update their details in Aadhaar by visiting Enrolment Center or online (depending upon type of update) and then raise the request for Aadhaar PVC Card after successful completion of update request."
    }, {
      question: "How many days will it take to receive \u201CAadhaar PVC Card\u201D after placing the order successfully?",
      answer: "After receiving order for Aadhaar PVC Card, UIDAI hands over printed Aadhaar Card to DoP within 5 working days (excluding the date of request). Aadhaar PVC Card is delivered via SPEED POST Service of India Post in line with existing delivery norms to the address registered in Aadhaar database. The status of same can be tracked using DoP Tracking Services through below link: <a href='https://www.indiapost.gov.in/' target='_blank'>https://www.indiapost.gov.in/</a>"
    }],
    verifyEmailMobile: [{
      question: "What if my mobile number or email is not registered with Aadhaar?",
      answer: "You may visit the nearest Aadhaar Seva Kendra or authorised Aadhaar enrolment/update centre for assistance."
    }, {
      question: "How can I verify my mobile number on myAadhaar?",
      answer: "You can verify your mobile number by accessing 'Check email/mobile number' service on the myAadhaar Portal, entering  Aadhaar number, mobile number and Captcha."
    }, {
      question: "How can I verify my email on myAadhaar?",
      answer: "You can verify your email by accessing 'Check email/mobile number' service on the myAadhaar Portal, entering  Aadhaar number, email address and Captcha."
    }, {
      question: "Can I verify an email ID that is not linked with my Aadhaar?",
      answer: "No, only the email ID already registered with your Aadhaar can be verified through this service."
    }],
    orderAadhaarPvcCard: [{
      question: "From where an Aadhaar number holder can download e-Aadhaar?",
      answer: "Aadhaar Number holder can download e-Aadhaar by visiting UIDAI's MyAadhaar portal- https://myaadhaar.uidai.gov.in or by using mAadhaar app for mobile phones. "
    }],
    retrieveEidAadhaarNumber: [{
      question: "How many times Aadhaar data can be updated?",
      answer: "Following limits are applicable for the update of Aadhaar information: \n\u2022 Name: Twice in Life Time \n\u2022 Gender: Once in Life Time \n\u2022 Date of Birth: Once in life time"
    }, {
      question: "What changes can I do to my name in Aadhaar?",
      answer: "For minor corrections in your name or change in name, kindly visit nearest Aadhaar Seva Kendra."
    }, {
      question: "What documents are required for Online Address Update?",
      answer: "POA document as per supporting document list will be required. Visit <a href='https://uidai.gov.in' target='_blank'>https://uidai.gov.in.</a>"
    }, {
      question: "Which are the documents required for updation in Aadhaar Address?",
      answer: "List of supporting documents which you can select from is available here. Please select the appropriate document from the list and provide a scan/image of the same while undertaking demographic data correction."
    }, {
      question: "How can I submit my supporting documents in case of Address Update online Service?",
      answer: "You will be prompted to upload scan/image of the supporting document in pdf or jpeg format in the Update Address online Service. Please upload correct supporting document for processing of your request. For certain documents like Passport, Rent and Property agreement, image of multiple pages would be required."
    }, {
      question: "Can I update my local language through Update Aadhaar online Service?",
      answer: "At present you can not update your local language through online portal."
    }, {
      question: "Can I update my date of birth through Update Aadhaar online Service?",
      answer: "No, to update Date of Birth (DoB) kindly visit nearest Aadhaar Seva Kendra with DoB proof document."
    }, {
      question: "I have already updated Date of Birth in my Aadhaar once. Can I update/ correct it?",
      answer: "No. You can update your Date of Birth (DoB) only once. Further Date of Birth (DoB) can be changed under exceptional circumstances, kindly call 1947 in this regard."
    }, {
      question: "Does submission of request guarantee update of demographic information?",
      answer: "Submission of information does not guarantee update of Aadhaar data. Changes submitted through Update Aadhaar online Service are subjected to verification and validation by the UIDAI and after validation only the change request is processed further for Aadhaar update."
    }, {
      question: "I have lost my mobile number/ do not possess the number that I enrolled with Aadhaar. How should I submit my update request?",
      answer: "In case you have lost/do not possess the mobile number anymore that is registered with Aadhaar, you have to personally visit the nearest Aadhaar Seva Kendra for updation of mobile number."
    }, {
      question: "Will my Aadhaar number get changed after updation?",
      answer: "No, your Aadhaar number will remain same even after the update."
    }, {
      question: "I want to cancel the update request. Will I be able to do it?",
      answer: "A resident can cancel the update request from the \u2018Requests\u2019 space in the myAadhaar dashboard until the request is picked up for further processing. If cancelled, the amount paid will be refunded to the account within 21 days."
    }, {
      question: "Where can I see all my update requests? ",
      answer: "A resident can view his/her update requests inside the \u2018Requests\u2019 space inside the myAadhaar dashboard."
    }, {
      question: "How do I add my father\u2019s / husband\u2019s name to my address?",
      answer: "Relationship details are a part of address field in Aadhaar. This has been standardized to C/o (Care of). Filling this is optional."
    }],
    eaadhaarDownload: [{
      question: "What is e-Aadhaar?",
      answer: "e-Aadhaar is a password protected electronic copy of Aadhaar, digitally signed by UIDAI."
    }, {
      question: "Is e-Aadhaar equally valid like physical copy of Aadhaar?",
      answer: "As per Aadhaar Act, e-Aadhaar is equally valid like Physical Copy of Aadhaar for all purposes. For validity of e-Aadhaar, please visit UIDAI circular- <a href='https://uidai.gov.in/images/ uidai_om_on_e_aadhaar_validity.pdf' target='_blank'>https://uidai.gov.in/images/ uidai_om_on_e_aadhaar_validity.pdf</a>"
    }, {
      question: "What is Masked Aadhaar?",
      answer: "Masked Aadhaar implies replacing of first 8 digits of Aadhaar number with \u201Cxxxx-xxxx\u201D while only last 4 digits of the Aadhaar Number are visible."
    }, {
      question: "How do I validate the digital signature?",
      answer: "To successfully validate the digital signature on e-Aadhaar and see the 'green tick' in the PDF, we recommend that you download and open it in the latest version of Adobe Acrobat Reader on Microsoft Windows or MacOS. </br></br>If the signature still shows a warning or question mark, you may need to manually add the signing certificate to your trusted identities.</br></br> Instructions on how to do this can be found on the Adobe Help website: <a href='https://helpx.adobe.com/acrobat/using/trusted-identities.html' target='_blank'>https://helpx.adobe.com/acrobat/using/trusted-identities.html</a>"
    }, {
      question: "What Is the Password of e-Aadhaar?",
      answer: "Password of e-Aadhaar is a combination of the first 4 letters of name in CAPITAL and the year of birth (YYYY).<br/><br/><b>For Example:</b>\nExample 1<ol><li>Name: SURESH KUMAR</li><li>Year of Birth: 1990</li><li>Password: SURE1990</li></ol>\nExample 2<ol><li>Name: SAI KUMAR</li><li>Year of Birth: 1990</li><li>Password: SAIK1990</li></ol>\nExample 3<ol><li>Name: P. KUMAR</li><li>Year of Birth: 1990</li><li>Password: P.KU1990</li></ol>\nExample 4<ol><li>Name: RIA</li><li>Year of Birth: 1990</li><li>Password: RIA1990</li></ol>"
    }, {
      question: "What supporting software needed to open e-Aadhaar?",
      answer: "Resident needs 'Adobe Reader' to view e-Aadhaar. You have 'Adobe Reader' installed in your System. To install Adobe Reader in the System\nvisit <a href='https://get.adobe.com/reader/' target='_blank'>https://get.adobe.com/reader/</a>"
    }, {
      question: "How can an Aadhaar Number holder download e-Aadhaar?",
      answer: "An Aadhaar Number holder can download e-Aadhaar by following three ways.\nBy Using Enrolment Number:\nBy Using Aadhaar No:\nBy using VID:\nOTP for downloading e-Aadhaar will be received on registered mobile number."
    }],
    bookAnAppointment: [{
      question: "What are the grievance redressal channels in UIDAI?",
      answer: "Individuals can reach UIDAI through multiple channels viz. Phone, Email, Chat, Letter/Post, Web Portal, Walk in and Social Media for their grievance redressal.\nThe detailed information about available channels are as below:\n Phone Call (Toll Free Number) -\nIndividuals can contact UIDAI Toll Free Number (1947) for concerns related to Aadhaar. UIDAI contact center consists of a self service IVRS (Interactive Voice Response system) and Individual Support Executive based assistance. Individual can choose any of below mentioned language for communication as per their ease.\n Hindi\n5. Kannada\n9. Guajarati\n English\n6. Malayalam\n10. Marathi\n Telugu\n Assamese\n Punjabi\n4. Tamil\n Bengali\n Odia\nTimings:\na) Availing of self service through IVRS: Services through IVRS can be availed in self service mode on 24X7 basis.\nb) Support Executive assistance: This service can be availed from Monday - Saturday: 7 AM to 11 PM,  Sunday: 8 AM to 5 PM.\nGeneral Queries are resolved by Contact Center Executive through UIDAI approved Standard Responses and complaints are assigned to concerned Divisions/Regional Offices of UIDAI on real time basis. These complaints are examined internally at concerned Division/Regional Offices of UIDAI for effective resolution and communication thereafter to the individual.\n2. Chatbot (Aadhaar Mitra) \u2013 Individuals can raise their concern related to Aadhaar through UIDAI chatbot service 'Aadhaar Mitra' which is available on UIDAI\u2019s Official website This chatbot is trained to respond to the queries and aimed at improving the individual experience.\n3. UIDAI Web Portal \u2013 Individuals can lodge and check the status of their grievance on UIDAI website under Grievance and Feedback & Check Grievance / Feedback Status respectively.. \n Email \u2013 Individuals can send email to help@uidai.gov.in for any queries and complaint related to Aadhaar.\n Walk-In at Regional Offices: Individuals can directly walk in to the respective regional offices according to their state for the resolution of their queries or submission of complaints related to Aadhaar.\n6. Post/Letter: Individuals can lodge their grievances in UIDAI HO or Regional offices through post or submit application by hand. The concerned Regional Office/ division will take necessary steps to resolve the grievance.\n Public Grievance Portal (CPGRAMS) of the Government of India: Grievances can be lodged at UIDAI through Centralized Public Grievance Redress and Monitoring System (CPGRAMS).This is an online platform available for the citizens 24x7.\n Social Media: Grievances may be lodged through multiple social media platforms like Twitter, Facebook, You tube, Instagram etc. Individual can upload a post related to their concern/grievance tagging the UIDAI or DM the support page on different social media streams."
    }, {
      question: "Are the service charges different for Aadhaar Seva Kendras?",
      answer: "No, the charges for Aadhaar Services are same across all the Aadhaar centres in the country including Aadhaar Seva Kendras .\nFor charges please refer : Aadhaar Enrolment & Update Charges"
    }, {
      question: "Can I reschedule/ cancel my appointment?",
      answer: "Yes, you can reschedule the appointment before 24 hours by logging into the appointment portal with the same mobile number/ email ID (as given earlier)."
    }, {
      question: "What services I can avail from Aadhaar Seva Kendra?",
      answer: "Aadhaar Seva Kendras provides all type of Aadhaar services such as\n New Enrolment for all age group.\n Update of any demographic Information (Name, Address, Gender, Date of Birth, Mobile number and Email Id).\n Update of biometric information (Photo, Fingerprints and Iris Scans) .\n Mandatory Biometric Update of children (attaining the age of 5 and 15 years).\n Document update (POI and POA) .\n Find & Print Aadhaar."
    }, {
      question: "What are the timings of UIDAI ASKs (Aadhaar Seva Kendras)?",
      answer: "Aadhaar Seva Kendras are open all 7 days of the week excluding national/regional holidays. Normally it functions from 9:30 AM to 5:30 PM (IST).\nAadhaar Enrolment Centres other than UIDAI ASKs follow timings as defined by their respective registrars. Individuals seeking enrolment/ Aadhaar number holders may contact their nearby Aadhaar Enrolment Centre for more information."
    }, {
      question: "What is Aadhaar Seva Kendra (ASK)?",
      answer: "\u2018Aadhaar Seva Kendra\u2019 or ASK is a single-stop destination for all Aadhaar services for the residents. ASK offer dedicated Aadhaar enrolment and update services to residents in a state-of-the-art environment. The Aadhaar Seva Kendra offers a comfortable air-conditioned environment to residents. All ASK are wheelchair friendly and have special provisions to service the elderly and specially abled. More info on ASKs is available here: uidai.gov.in website."
    }, {
      question: "Where can I find the list of UIDAI ASKs (Aadhaar Seva Kendras)?",
      answer: "A consolidated list of all functional ASKs is available at: Aadhaar Seva Kendra List\nThese ASKs are available in addition to Aadhaar Enrolment Centres already run by Banks, Post Offices, CSC, BSNL and State Governments."
    }],
    checkEnrolmentUpdateStatus: [{
      question: "What details can I update through Update Aadhaar online Service?",
      answer: "Through this online portal, you can perform only Address and Document update. For any other update, kindly visit the nearest Aadhaar Seva Kendra."
    }],
    checkAadhaarValidity: [{
      question: "How Aadhaar PVC Card is different from Aadhaar Letter?",
      answer: "Aadhaar letter is laminated paper based document issued to the Aadhaar number holders after enrolment or update. Aadhaar PVC Card is PVC based durable and easy to carry card with multiple security features. Aadhaar PVC card is equally valid."
    }],
    lockUnlockAadhaar: [{
      question: "My update request got rejected for invalid documents. What does this mean?",
      answer: "The document you use for Online Address Update should be:\n\u2022 Valid document as per <a href='https://uidai.gov.in' target='_blank'>https://uidai.gov.in</a>.\n\u2022 The document uploaded is in the name of the resident.\n\u2022 Image uploaded should be clear and colored scan of original document.\nEnsure that you follow the above before you create a new update request."
    }, {
      question: "What is Aadhaar (UID) Lock & Unlock?",
      answer: "For a resident, security and privacy of personal data is always a primary concern. To strengthen the security of his/her Aadhaar number and to provide control to the resident, UIDAI provide a mechanism of locking and unlocking Aadhaar number (UID).\nResident can lock his or her Aadhaar (UID) via UIDAI website www.myaadhaar.uidai.gov.in or through mAadhaar app.\nBy doing this Resident cannot perform any sort of Authentication using UID, UID Token & VID for Biometrics, Demographic & OTP modality\nIf resident wants to unlock UID he/she can do so by using latest VID, through UIDAI website or mAadhaar app.\nAfter unlocking Aadhaar (UID), resident can perform authentication using UID, UID Token & VID."
    }, {
      question: "How can resident Lock UID?",
      answer: "For Locking UID, Resident should have 16 digit VID number and it's a pre-requisite for locking. If resident don't have VID can generate via SMS Service or UIDAI website (www.myaadhaar.uidai.gov.in).\nSMS Service. GVID space last 4 or 8 digit of UID. SMS to 1947.Ex-GVID 1234.\nResident may visit UIDAI website <a href='https://resident.uidai.gov.in/aadhaar-lockunlock' target='_blank'>https://resident.uidai.gov.in/aadhaar-lockunlock</a> Under My Aadhaar tab, Click on Aadhaar Lock & Unlock services. Select UID Lock Radio Button and enter UID Number, Full Name, and Pin Code as in latest details and enter Security code. Click on Send OTP and click on submit. Your UID will be locked successfully."
    }, {
      question: "How can resident Unlock UID?",
      answer: "For Unlocking UID resident should have latest 16 digit VID and if resident forgot 16 digit VID he can retrieve latest VID through SMS services\nRVID Space last 4 or 8 digit of UID. SMS to 1947. Ex- RVID 1234\nTo unlock UID, resident may visit UIDAI website <a href='https://resident.uidai.gov.in/aadhaar-lockunlock' target='_blank'>https://resident.uidai.gov.in/aadhaar-lockunlock</a> , select Unlock radio button, Enter Latest VID and security Code and click on send OTP and click on Submit. Your UID will be unlocked successfully.\nResident may also use Aadhaar lock or unlock service through mAadhaar app."
    }],
    grievanceAndFeedback: [],
    generateOrRetrieveVid: [{
      question: "What is Virtual ID (VID)?",
      answer: "VID is a temporary, revocable 16-digit random number mapped with the Aadhaar number. VID can be used in lieu of Aadhaar number whenever authentication or e-KYC services are performed. Authentication may be performed using VID in a manner similar to using Aadhaar number. It is not possible to derive Aadhaar number from VID."
    }, {
      question: "I forgot my VID. How can I get it after locking UID?",
      answer: "After Locking UID if resident forgot VID, Resident can make use of SMS service to Retrieve 16 digit VID. Resident will receive VID on his/her register mobile number.Send following SMS to 1947 from Aadhaar Register mobile number,SMS: RVID Space last 4 or 8 digit of UID.Ex:- RVID 1234"
    }, {
      question: "How does a resident obtain VID?",
      answer: "VID can be generated only by the Aadhaar number holder. They can also replace (generate a new VID) their VID from time to time. At any given time only one VID will be valid for an Aadhaar number. UIDAI provide various options to Aadhaar number holders to generate their VID, retrieve their VID in case they forget, and replace their VID with a new number. These options will be made available via UIDAI\u2019s website (www.myaadhaar.uidai.gov.in) , e-Aadhaar download, mAadhaar mobile application, etc.\nVID can also be generated by sending an SMS to the Aadhaar helpline number 1947. Resident will have to type \u201CGVIDLast 4 digits of Aadhaar Number\u201D and send it to 1947 through the registered Mobile Number."
    }, {
      question: "Can anyone else generate VID for me?",
      answer: "No other entity like AUA/KUA can generate VID on behalf of Aadhaar number holder. The VID can be generated by Aadhaar number holder by himself/herself only. Aadhaar number holder will receive the VID through SMS on registered mobile number."
    }, {
      question: "What if an Aadhaar number holder forgets VID? Can he/she obtain again?",
      answer: "Yes, UIDAI provide multiple ways to generate new and/or retrieve current VID. These options are made available via UIDAI\u2019s website (www.myaadhaar.uidai.gov.in) , e-Aadhaar, mAadhaar mobile application, SMS, etc.\nFor retrieval of VID, Aadhaar number holder may send SMS to the Aadhaar helpline number 1947. Resident will have to type \u201CRVID Last 4 digits of Aadhaar Number\u201D and send it to 1947 through the registered Mobile Number."
    }, {
      question: "Can VID be used for OTP or biometrics or demographics authentication?",
      answer: "Yes. VID can be used in lieu of Aadhaar number to perform Aadhaar Authentication."
    }, {
      question: "In case of VID, do I need to provide consent for authentication?",
      answer: "Yes, Aadhaar number holder consent is necessary for VID based authentication. Agency is required to inform the Aadhaar number holder the purpose for authentication and collect explicit consent for performing authentication."
    }, {
      question: "Can an agency store VID?",
      answer: "No. Since VID is temporary and can be changed by the Aadhaar number holder, storing VID has no value. Agencies should not store VID in any database or logs."
    }, {
      question: "Will re-generation of VID lead to the same VID or a different VID?",
      answer: "After the minimum validity period (currently set as 1 calender day or after midnight 12), Aadhaar number holder may requests regeneration of a new VID. In this way, new VID will be generated and the previous VID will be deactivated.\nIn case, if resident opts for retrieval of VID, the last active VID will be sent to the Aadhaar number holder through SMS. Resident will have to type \u201CRVIDLast 4 digits of Aadhaar Number\u201D and send it to 1947 through the registered Mobile Number."
    }],
    checkGrievanceFeedback: [{
      question: "How to get confirmed that the grievance got registered successfully?",
      answer: "Upon the successful submission of a grievance in the UIDAI CRM system, a 14-digit SRN (starting with S20) will be generated and shared with the Aadhaar Number Holder. The delivery method depends on the contact details provided and the channel used to file the grievance."
    }],
    checkGrievanceFeedbackStatus: [{
      question: "How to check the status of Service Request Number?",
      answer: "The status of the Service Request Number can be checked using the 14-digit SRN (starting with S20)."
    }],
    deceasedService: [{
      question: "Who is the intended user of this service?",
      answer: "An Aadhaar Number Holder who wishes to report the death of a family member."
    }, {
      question: "What is the objective of this service?",
      answer: "The facility is extended to receive request for deactivation of such Aadhaar where its holder has passed away."
    }, {
      question: "Who can report such cases?",
      answer: "Child / Ward / Sibling / Legal Guardian / Spouse / Father / Mother of the deceased."
    }, {
      question: "What documents / information is required to report death of a family member?",
      answer: "(i)	Death Certificate of the deceased family member.<br/>(ii)	Aadhaar number of the deceased family member."
    }, {
      question: "What will be outcome of such reporting?",
      answer: "After said reporting and successful validation by UIDAI, the Aadhaar of the deceased person would be deactivated."
    }, {
      question: "How many states are covered under this service?",
      answer: "At present, the facility is available for death certificates issued by 24 States/ UTs i.e. Andaman & Nicobar Islands, Andhra Pradesh, Arunachal Pradesh, Assam, Bihar, Chandigarh, Chhattisgarh, Dadra and Nagar Haveli and Daman and Diu, Haryana, Himachal Pradesh, Jammu and Kashmir, Jharkhand, Ladakh, Lakshadweep, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Uttar Pradesh and Uttarakhand.Efforts are underway to extend the same to remaining States/ UTs."
    }, {
      question: "What is the timeline for such deactivation?",
      answer: "90 days from acceptance of request."
    }, {
      question: "What action is needed if one is getting a message (at form submission stage) “Entered Aadhaar is already deactivated” or “Entered Aadhaar is already omitted”?",
      answer: "As Aadhaar of the deceased person is already deactivated/ cancelled, no action is necessary in this regard."
    }, {
      question: "What action is needed if one is getting a message (at form submission stage) “Demographic information provided does not match with the information available in the Aadhaar database”?",
      answer: "Please ensure that correct Aadhaar number has been entered or that data in the records of death certificate issuing authority is same as that in Aadhaar."
    }, {
      question: "What action is needed if one is getting a message (at form submission stage) “Demographic information provided does not match with the information available in the database of death certificate issuing authority. Kindly contact death certificate issuing authority”?",
      answer: "The entered information was not found to match with the data received from death certificate issuing authority. Please contact death certificate issuing authority for making necessary rectification."
    }, {
      question: "How will I get the update on my request?",
      answer: "You will get confirmation of deactivation or rejection of request via SMS after completion of the activity."
    }]
  }
};
/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "F", 0, /* binding */ TRANSLATIONS_EN
/* harmony export */ ]);


/***/ },

/***/ 92876
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var i18next__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12539);
/* harmony import */ var react_i18next__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(37276);
/* harmony import */ var i18next_browser_languagedetector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(17508);
/* harmony import */ var _english_translations__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(87177);




i18next__WEBPACK_IMPORTED_MODULE_0__["default"].use(i18next_browser_languagedetector__WEBPACK_IMPORTED_MODULE_2__/* ["default"] */ .A).use(react_i18next__WEBPACK_IMPORTED_MODULE_1__.initReactI18next).init({
  lng: "en_IN",
  fallbackLng: "en_IN",
  resources: {
    en_IN: {
      translation: _english_translations__WEBPACK_IMPORTED_MODULE_3__/* .TRANSLATIONS_EN */ .F
    }
  },
  interpolation: {
    escapeValue: false
  }
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (i18next__WEBPACK_IMPORTED_MODULE_0__["default"]);
/* harmony export */ __webpack_require__.d(__webpack_exports__, [
/* harmony export */   "default", 0, __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ ]);


/***/ },

/***/ 17508
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ Browser)
/* harmony export */ });
const {
  slice,
  forEach
} = [];
function defaults(obj) {
  forEach.call(slice.call(arguments, 1), source => {
    if (source) {
      for (const prop in source) {
        if (obj[prop] === undefined) obj[prop] = source[prop];
      }
    }
  });
  return obj;
}
function hasXSS(input) {
  if (typeof input !== 'string') return false;

  // Common XSS attack patterns
  const xssPatterns = [/<\s*script.*?>/i, /<\s*\/\s*script\s*>/i, /<\s*img.*?on\w+\s*=/i, /<\s*\w+\s*on\w+\s*=.*?>/i, /javascript\s*:/i, /vbscript\s*:/i, /expression\s*\(/i, /eval\s*\(/i, /alert\s*\(/i, /document\.cookie/i, /document\.write\s*\(/i, /window\.location/i, /innerHTML/i];
  return xssPatterns.some(pattern => pattern.test(input));
}

// eslint-disable-next-line no-control-regex
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
const serializeCookie = function (name, val) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
    path: '/'
  };
  const opt = options;
  const value = encodeURIComponent(val);
  let str = `${name}=${value}`;
  if (opt.maxAge > 0) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge)) throw new Error('maxAge should be a Number');
    str += `; Max-Age=${Math.floor(maxAge)}`;
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }
    str += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }
    str += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }
    str += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) str += '; HttpOnly';
  if (opt.secure) str += '; Secure';
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === 'string' ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      case 'none':
        str += '; SameSite=None';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }
  if (opt.partitioned) str += '; Partitioned';
  return str;
};
const cookie = {
  create(name, value, minutes, domain) {
    let cookieOptions = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
      path: '/',
      sameSite: 'strict'
    };
    if (minutes) {
      cookieOptions.expires = new Date();
      cookieOptions.expires.setTime(cookieOptions.expires.getTime() + minutes * 60 * 1000);
    }
    if (domain) cookieOptions.domain = domain;
    document.cookie = serializeCookie(name, value, cookieOptions);
  },
  read(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  remove(name, domain) {
    this.create(name, '', -1, domain);
  }
};
var cookie$1 = {
  name: 'cookie',
  // Deconstruct the options object and extract the lookupCookie property
  lookup(_ref) {
    let {
      lookupCookie
    } = _ref;
    if (lookupCookie && typeof document !== 'undefined') {
      return cookie.read(lookupCookie) || undefined;
    }
    return undefined;
  },
  // Deconstruct the options object and extract the lookupCookie, cookieMinutes, cookieDomain, and cookieOptions properties
  cacheUserLanguage(lng, _ref2) {
    let {
      lookupCookie,
      cookieMinutes,
      cookieDomain,
      cookieOptions
    } = _ref2;
    if (lookupCookie && typeof document !== 'undefined') {
      cookie.create(lookupCookie, lng, cookieMinutes, cookieDomain, cookieOptions);
    }
  }
};

var querystring = {
  name: 'querystring',
  // Deconstruct the options object and extract the lookupQuerystring property
  lookup(_ref) {
    let {
      lookupQuerystring
    } = _ref;
    let found;
    if (typeof window !== 'undefined') {
      let {
        search
      } = window.location;
      if (!window.location.search && window.location.hash?.indexOf('?') > -1) {
        search = window.location.hash.substring(window.location.hash.indexOf('?'));
      }
      const query = search.substring(1);
      const params = query.split('&');
      for (let i = 0; i < params.length; i++) {
        const pos = params[i].indexOf('=');
        if (pos > 0) {
          const key = params[i].substring(0, pos);
          if (key === lookupQuerystring) {
            found = params[i].substring(pos + 1);
          }
        }
      }
    }
    return found;
  }
};

var hash = {
  name: 'hash',
  // Deconstruct the options object and extract the lookupHash property and the lookupFromHashIndex property
  lookup(_ref) {
    let {
      lookupHash,
      lookupFromHashIndex
    } = _ref;
    let found;
    if (typeof window !== 'undefined') {
      const {
        hash
      } = window.location;
      if (hash && hash.length > 2) {
        const query = hash.substring(1);
        if (lookupHash) {
          const params = query.split('&');
          for (let i = 0; i < params.length; i++) {
            const pos = params[i].indexOf('=');
            if (pos > 0) {
              const key = params[i].substring(0, pos);
              if (key === lookupHash) {
                found = params[i].substring(pos + 1);
              }
            }
          }
        }
        if (found) return found;
        if (!found && lookupFromHashIndex > -1) {
          const language = hash.match(/\/([a-zA-Z-]*)/g);
          if (!Array.isArray(language)) return undefined;
          const index = typeof lookupFromHashIndex === 'number' ? lookupFromHashIndex : 0;
          return language[index]?.replace('/', '');
        }
      }
    }
    return found;
  }
};

let hasLocalStorageSupport = null;
const localStorageAvailable = () => {
  if (hasLocalStorageSupport !== null) return hasLocalStorageSupport;
  try {
    hasLocalStorageSupport = typeof window !== 'undefined' && window.localStorage !== null;
    if (!hasLocalStorageSupport) {
      return false;
    }
    const testKey = 'i18next.translate.boo';
    window.localStorage.setItem(testKey, 'foo');
    window.localStorage.removeItem(testKey);
  } catch (e) {
    hasLocalStorageSupport = false;
  }
  return hasLocalStorageSupport;
};
var localStorage = {
  name: 'localStorage',
  // Deconstruct the options object and extract the lookupLocalStorage property
  lookup(_ref) {
    let {
      lookupLocalStorage
    } = _ref;
    if (lookupLocalStorage && localStorageAvailable()) {
      return window.localStorage.getItem(lookupLocalStorage) || undefined; // Undefined ensures type consistency with the previous version of this function
    }
    return undefined;
  },
  // Deconstruct the options object and extract the lookupLocalStorage property
  cacheUserLanguage(lng, _ref2) {
    let {
      lookupLocalStorage
    } = _ref2;
    if (lookupLocalStorage && localStorageAvailable()) {
      window.localStorage.setItem(lookupLocalStorage, lng);
    }
  }
};

let hasSessionStorageSupport = null;
const sessionStorageAvailable = () => {
  if (hasSessionStorageSupport !== null) return hasSessionStorageSupport;
  try {
    hasSessionStorageSupport = typeof window !== 'undefined' && window.sessionStorage !== null;
    if (!hasSessionStorageSupport) {
      return false;
    }
    const testKey = 'i18next.translate.boo';
    window.sessionStorage.setItem(testKey, 'foo');
    window.sessionStorage.removeItem(testKey);
  } catch (e) {
    hasSessionStorageSupport = false;
  }
  return hasSessionStorageSupport;
};
var sessionStorage = {
  name: 'sessionStorage',
  lookup(_ref) {
    let {
      lookupSessionStorage
    } = _ref;
    if (lookupSessionStorage && sessionStorageAvailable()) {
      return window.sessionStorage.getItem(lookupSessionStorage) || undefined;
    }
    return undefined;
  },
  cacheUserLanguage(lng, _ref2) {
    let {
      lookupSessionStorage
    } = _ref2;
    if (lookupSessionStorage && sessionStorageAvailable()) {
      window.sessionStorage.setItem(lookupSessionStorage, lng);
    }
  }
};

var navigator$1 = {
  name: 'navigator',
  lookup(options) {
    const found = [];
    if (typeof navigator !== 'undefined') {
      const {
        languages,
        userLanguage,
        language
      } = navigator;
      if (languages) {
        // chrome only; not an array, so can't use .push.apply instead of iterating
        for (let i = 0; i < languages.length; i++) {
          found.push(languages[i]);
        }
      }
      if (userLanguage) {
        found.push(userLanguage);
      }
      if (language) {
        found.push(language);
      }
    }
    return found.length > 0 ? found : undefined;
  }
};

var htmlTag = {
  name: 'htmlTag',
  // Deconstruct the options object and extract the htmlTag property
  lookup(_ref) {
    let {
      htmlTag
    } = _ref;
    let found;
    const internalHtmlTag = htmlTag || (typeof document !== 'undefined' ? document.documentElement : null);
    if (internalHtmlTag && typeof internalHtmlTag.getAttribute === 'function') {
      found = internalHtmlTag.getAttribute('lang');
    }
    return found;
  }
};

var path = {
  name: 'path',
  // Deconstruct the options object and extract the lookupFromPathIndex property
  lookup(_ref) {
    let {
      lookupFromPathIndex
    } = _ref;
    if (typeof window === 'undefined') return undefined;
    const language = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
    if (!Array.isArray(language)) return undefined;
    const index = typeof lookupFromPathIndex === 'number' ? lookupFromPathIndex : 0;
    return language[index]?.replace('/', '');
  }
};

var subdomain = {
  name: 'subdomain',
  lookup(_ref) {
    let {
      lookupFromSubdomainIndex
    } = _ref;
    // If given get the subdomain index else 1
    const internalLookupFromSubdomainIndex = typeof lookupFromSubdomainIndex === 'number' ? lookupFromSubdomainIndex + 1 : 1;
    // get all matches if window.location. is existing
    // first item of match is the match itself and the second is the first group match which should be the first subdomain match
    // is the hostname no public domain get the or option of localhost
    const language = typeof window !== 'undefined' && window.location?.hostname?.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i);

    // if there is no match (null) return undefined
    if (!language) return undefined;
    // return the given group match
    return language[internalLookupFromSubdomainIndex];
  }
};

// some environments, throws when accessing document.cookie
let canCookies = false;
try {
  // eslint-disable-next-line no-unused-expressions
  document.cookie;
  canCookies = true;
  // eslint-disable-next-line no-empty
} catch (e) {}
const order = ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'];
if (!canCookies) order.splice(1, 1);
const getDefaults = () => ({
  order,
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  lookupSessionStorage: 'i18nextLng',
  // cache user language
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
  // cookieMinutes: 10,
  // cookieDomain: 'myDomain'

  convertDetectedLanguage: l => l
});
class Browser {
  constructor(services) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    this.type = 'languageDetector';
    this.detectors = {};
    this.init(services, options);
  }
  init() {
    let services = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      languageUtils: {}
    };
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let i18nOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    this.services = services;
    this.options = defaults(options, this.options || {}, getDefaults());
    if (typeof this.options.convertDetectedLanguage === 'string' && this.options.convertDetectedLanguage.indexOf('15897') > -1) {
      this.options.convertDetectedLanguage = l => l.replace('-', '_');
    }

    // backwards compatibility
    if (this.options.lookupFromUrlIndex) this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex;
    this.i18nOptions = i18nOptions;
    this.addDetector(cookie$1);
    this.addDetector(querystring);
    this.addDetector(localStorage);
    this.addDetector(sessionStorage);
    this.addDetector(navigator$1);
    this.addDetector(htmlTag);
    this.addDetector(path);
    this.addDetector(subdomain);
    this.addDetector(hash);
  }
  addDetector(detector) {
    this.detectors[detector.name] = detector;
    return this;
  }
  detect() {
    let detectionOrder = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.options.order;
    let detected = [];
    detectionOrder.forEach(detectorName => {
      if (this.detectors[detectorName]) {
        let lookup = this.detectors[detectorName].lookup(this.options);
        if (lookup && typeof lookup === 'string') lookup = [lookup];
        if (lookup) detected = detected.concat(lookup);
      }
    });
    detected = detected.filter(d => d !== undefined && d !== null && !hasXSS(d)).map(d => this.options.convertDetectedLanguage(d));
    if (this.services && this.services.languageUtils && this.services.languageUtils.getBestMatchFromCodes) return detected; // new i18next v19.5.0
    return detected.length > 0 ? detected[0] : null; // a little backward compatibility
  }
  cacheUserLanguage(lng) {
    let caches = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.options.caches;
    if (!caches) return;
    if (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(lng) > -1) return;
    caches.forEach(cacheName => {
      if (this.detectors[cacheName]) this.detectors[cacheName].cacheUserLanguage(lng, this.options);
    });
  }
}
Browser.type = 'languageDetector';




/***/ }

}]);