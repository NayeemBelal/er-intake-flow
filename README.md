This project is a digital intake flow for pateints at a ER

Currently, ERs are wasting so much money, space, time and headache on paper forms.

1. waste of paper and inc. Each registration packet is on average 6 pages, with some packets being > 6 pages. this is a hige waste of paper in inc for the ER
2. Wasted time. Front desk staff has to scan each page into the EMR manually using teh scanner, then for all the packets they have to audit them and make sure that they were entered correctly into the EMR. the time wasted here can be used to calcualte how much money is spent on a task that can be easily 100x quicker.

The goal of this project is to go digital. Here is the flow:

1. patient walks into ER
2. patient gets to front desk, and there is an ipad with a form open towards that lets them input name, DOB, phone number, reason why they are here, insurance photo and ID photo and presses submit
3. When they press submit, the front desk person gets a ticket in the front desk dashboard
   - in the home screen of their dahsboard, there will be like a queue or a list of all the patents they have currently and theyre status. pts will either waiting for forms, be filling out forms, sent in forms and waiting for front desk audit, or audited.
   - the front desk will see that a new patinet poped up in teh quee with status waiting for forms. they can then click into that patients name, see full details the patient inputted inlcuding ID and insrance photos. there will also be a multi select list of the forms that need to be sent to the patient.
     Forms: - registration packet (Always included) - MVA forms - Workers comp forms
   - they choose which forms to send to the pt (most will get just the registration forms, but there is also special forms for workers comp, and Motor vehicle accidents)
   - Once they choose the forms, the front desk clicks a send forms button, and that will send an SMS message directly to the pts phone using twilio.
   - this link will be a PDF filler that will allow the patient to see all the forms in their phone, and input in the information in the forms.
4. once the pt is done with the forms, they press submit, and it goes back to the front desk and they get pinged again and the status of the patient in the dashboard changes. when the front desk clicks into it, they will be able to see a button called Audit forms. Clicking that, will open the forms into a PDF editor with the patietns changes, and they will then the front desk person will be able to input in their signatures.
5. The front desk then does the first audit of the forms, puts in whatever signatures they need to put in
6. Once the form audit is complete, then, finally, the export button to download the files becomes clickable.

So their are 3 parts we need to build:

1. the form that the patient sees when they first walk in on the Ipad (/intake)
   - allows them to input name, DOB, phone number, why they are here. then on the next screen allows them to take photos of the ID and insurance card
2. The front desk dashboard (/)
   - Lets the front desk person manage, keep track of, and audit all the patients
   - We want to make this nice, clean, and aesthtic.
3. The PDF filler that gets sent to the patient with all the forms (/form)
   - hopefully we can use a premade library for this. I already have the PDFs, i just need to editable PDF editor
