
/* =====================================================
   LINKTECH RESUME AND LETTERS
   Professional Document Studio
   Version 1.0
===================================================== */

/* =====================================================
   1. ELEMENTS AND SETTINGS
===================================================== */

const $ = id => document.getElementById(id);

const resumePaper = $("resumePaper");
const letterPaper = $("letterPaper");

let currentTemplate = 0;
let photoData = "";
let zoomLevel = 1;
let saveTimer = null;

const STORAGE_KEY = "linktech_resume_letters_v1";


/* =====================================================
   2. TEN RESUME TEMPLATES
===================================================== */

const templates = [
    {
        name: "Classic Professional",
        description: "Traditional business layout",
        theme: "classic"
    },
    {
        name: "Modern Two Column",
        description: "Modern professional style",
        theme: "modern"
    },
    {
        name: "Professional Sidebar",
        description: "Skills-focused layout",
        theme: "sidebar"
    },
    {
        name: "Minimal Elegant",
        description: "Simple and clean design",
        theme: "minimal"
    },
    {
        name: "Executive",
        description: "Corporate leadership style",
        theme: "executive"
    },
    {
        name: "Creative Blue",
        description: "Creative professional design",
        theme: "creative"
    },
    {
        name: "Compact One Page",
        description: "Space-saving design",
        theme: "compact"
    },
    {
        name: "Academic",
        description: "Education and research",
        theme: "academic"
    },
    {
        name: "Technology",
        description: "IT and technical careers",
        theme: "tech"
    },
    {
        name: "Elegant Accent",
        description: "Refined professional style",
        theme: "elegant"
    }
];


/* =====================================================
   3. DEFAULT RESUME INFORMATION
===================================================== */

const defaultResume = {
    name: "ALEXANDRA REYES",

    role: "ADMINISTRATIVE ASSISTANT",

    contact:
        "Zamboanga City, Philippines | 09XX XXX XXXX | alex.reyes@email.com",

    summary:
        "Organized and dependable professional with experience supporting daily office operations, customer service, records management, and team coordination. Skilled in communication, documentation, and problem-solving.",

    skills: [
        "Office administration and documentation",
        "Microsoft Word, Excel, and PowerPoint",
        "Customer service and communication",
        "Time management and organization",
        "Team coordination and problem-solving"
    ],

    experience: [
        {
            position: "Administrative Assistant",
            company: "ABC Business Center",
            period: "2022 – Present",
            description:
                "Prepared reports, organized records, handled inquiries, and supported daily office operations."
        },
        {
            position: "Office Staff",
            company: "XYZ Services",
            period: "2020 – 2022",
            description:
                "Maintained accurate files, assisted customers, and coordinated schedules and office supplies."
        }
    ],

    education: [
        {
            degree: "Bachelor of Science in Business Administration",
            school: "Example State College",
            period: "2016 – 2020",
            description:
                "Relevant coursework: management, communication, and office systems."
        }
    ],

    certifications:
        "Add relevant certificates, training, or professional licenses here.",

    additional:
        "References available upon request."
};

let resumeData = JSON.parse(JSON.stringify(defaultResume));


/* =====================================================
   4. HTML SAFETY
===================================================== */

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => {

        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];

    });

}


/* =====================================================
   5. TEMPLATE PREVIEW CARDS
===================================================== */

function renderTemplates() {

    const container = $("templateList");

    container.innerHTML = "";

    templates.forEach((template, index) => {

        const card = document.createElement("button");

        card.type = "button";

        card.className =
            "template-card " +
            (index === currentTemplate ? "active" : "");

        card.innerHTML = `

            <div class="template-thumb">

                ${
                    ["modern", "sidebar", "executive",
                     "creative", "academic", "tech",
                     "elegant"].includes(template.theme)
                    ? '<div class="thumb-side"></div>'
                    : ''
                }

                <div class="thumb-content">

                    <div class="thumb-line blue"></div>

                    <div class="thumb-line"></div>

                    <div class="thumb-line"></div>

                    <div class="thumb-line blue"></div>

                    <div class="thumb-line"></div>

                </div>

            </div>

            <strong>
                ${index + 1}. ${template.name}
            </strong>

            <small>
                ${template.description}
            </small>

        `;

        card.addEventListener("click", () => {

            currentTemplate = index;

            renderTemplates();

            renderResume();

            saveAll();

            showToast(template.name + " selected.");

        });

        container.appendChild(card);

    });

}


/* =====================================================
   6. RESUME SECTION GENERATOR
===================================================== */

function createSection(title, content) {

    return `

        <section class="resume-section">

            <h2 contenteditable="true">
                ${escapeHTML(title)}
            </h2>

            <div class="section-content">

                ${content}

            </div>

        </section>

    `;

}


/* =====================================================
   7. RESUME CONTENT GENERATOR
===================================================== */

function renderResume() {

    const theme = templates[currentTemplate].theme;

    const size = $("photoSize").value;

    const shape = $("photoShape").value;

    const photoClass =
        size === "none" ? "" : "photo-" + size;

    const shapeClass = "photo-" + shape;

    resumePaper.className =

        `resume-paper theme-${theme} ${photoClass} ${shapeClass}`;


    /* SKILLS */

    const skillsHTML = resumeData.skills.map((skill, index) => {

        return `

            <li data-skill-index="${index}">

                <span contenteditable="true">
                    ${escapeHTML(skill)}
                </span>

                <button
                    class="delete-item"
                    data-delete-skill="${index}"
                    title="Delete skill"
                    type="button"
                >×</button>

            </li>

        `;

    }).join("");


    /* EXPERIENCE */

    const experienceHTML =
        resumeData.experience.map((item, index) => {

        return `

            <div class="resume-entry">

                <strong contenteditable="true">
                    ${escapeHTML(item.position)}
                </strong>

                <div class="meta" contenteditable="true">
                    ${escapeHTML(item.company)}
                    • ${escapeHTML(item.period)}
                </div>

                <p contenteditable="true">
                    ${escapeHTML(item.description)}
                </p>

                <button
                    class="delete-item"
                    data-delete-experience="${index}"
                    type="button"
                >
                    Delete experience
                </button>

            </div>

        `;

    }).join("");


    /* EDUCATION */

    const educationHTML =
        resumeData.education.map((item, index) => {

        return `

            <div class="resume-entry">

                <strong contenteditable="true">
                    ${escapeHTML(item.degree)}
                </strong>

                <div class="meta" contenteditable="true">
                    ${escapeHTML(item.school)}
                    • ${escapeHTML(item.period)}
                </div>

                <p contenteditable="true">
                    ${escapeHTML(item.description)}
                </p>

                <button
                    class="delete-item"
                    data-delete-education="${index}"
                    type="button"
                >
                    Delete education
                </button>

            </div>

        `;

    }).join("");


    /* PROFILE PHOTO */

    const photoHTML = photoData && size !== "none"

        ? `

            <img
                class="profile-photo"
                src="${photoData}"
                alt="Profile photo"
                style="display:block"
            >

        `

        : `

            <div class="photo-placeholder">
                PHOTO
            </div>

        `;


    /* RESUME */

    resumePaper.innerHTML = `

        <header class="resume-header">

            ${photoHTML}

            <div class="resume-heading">

                <h1 contenteditable="true">
                    ${escapeHTML(resumeData.name)}
                </h1>

                <div
                    class="job-title"
                    contenteditable="true"
                >
                    ${escapeHTML(resumeData.role)}
                </div>

                <div
                    class="resume-contact"
                    contenteditable="true"
                >
                    ${escapeHTML(resumeData.contact)}
                </div>

            </div>

        </header>


        <div class="resume-content">

            <div class="resume-column">

                ${createSection(
                    "Professional Profile",

                    `<p contenteditable="true">
                        ${escapeHTML(resumeData.summary)}
                    </p>`
                )}


                ${createSection(
                    "Key Skills",

                    `

                        <ul>
                            ${skillsHTML}
                        </ul>

                        <button
                            type="button"
                            class="add-item"
                            id="addSkill"
                        >
                            + Add Skill
                        </button>

                    `
                )}


                ${createSection(
                    "Certifications",

                    `<p contenteditable="true">
                        ${escapeHTML(resumeData.certifications)}
                    </p>`
                )}


                ${createSection(
                    "Additional Information",

                    `<p contenteditable="true">
                        ${escapeHTML(resumeData.additional)}
                    </p>`
                )}

            </div>


            <div class="resume-column">

                ${createSection(
                    "Work Experience",

                    `

                        ${experienceHTML}

                        <button
                            type="button"
                            class="add-item"
                            id="addExperience"
                        >
                            + Add Experience
                        </button>

                    `
                )}


                ${createSection(
                    "Education",

                    `

                        ${educationHTML}

                        <button
                            type="button"
                            class="add-item"
                            id="addEducation"
                        >
                            + Add Education
                        </button>

                    `
                )}

            </div>

        </div>

    `;


    bindResumeEvents();

}


/* =====================================================
   8. RESUME EDITING AND DELETING
===================================================== */

function bindResumeEvents() {

    resumePaper.querySelectorAll("[contenteditable='true']")
        .forEach(element => {

            element.addEventListener("input", () => {

                updateResumeData();

                scheduleSave();

            });

        });


    /* DELETE SKILL */

    resumePaper.querySelectorAll("[data-delete-skill]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.deleteSkill);

                resumeData.skills.splice(index, 1);

                renderResume();

                saveAll();

            });

        });


    /* DELETE EXPERIENCE */

    resumePaper.querySelectorAll("[data-delete-experience]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.deleteExperience);

                resumeData.experience.splice(index, 1);

                renderResume();

                saveAll();

            });

        });


    /* DELETE EDUCATION */

    resumePaper.querySelectorAll("[data-delete-education]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const index =
                    Number(button.dataset.deleteEducation);

                resumeData.education.splice(index, 1);

                renderResume();

                saveAll();

            });

        });


    /* ADD SKILL */

    const addSkill = $("addSkill");

    if (addSkill) {

        addSkill.addEventListener("click", () => {

            const value = prompt("Enter a new skill:");

            if (!value || !value.trim()) return;

            resumeData.skills.push(value.trim());

            renderResume();

            saveAll();

        });

    }


    /* ADD EXPERIENCE */

    const addExperience = $("addExperience");

    if (addExperience) {

        addExperience.addEventListener("click", () => {

            const position = prompt("Job position:");

            if (!position) return;

            const company = prompt("Company name:") || "";

            const period = prompt("Employment period:") || "";

            const description =
                prompt("Job description:") || "";

            resumeData.experience.push({

                position,
                company,
                period,
                description

            });

            renderResume();

            saveAll();

        });

    }


    /* ADD EDUCATION */

    const addEducation = $("addEducation");

    if (addEducation) {

        addEducation.addEventListener("click", () => {

            const degree = prompt("Degree or qualification:");

            if (!degree) return;

            const school = prompt("School name:") || "";

            const period = prompt("Year attended:") || "";

            const description =
                prompt("Additional information:") || "";

            resumeData.education.push({

                degree,
                school,
                period,
                description

            });

            renderResume();

            saveAll();

        });

    }

}


/* =====================================================
   9. UPDATE RESUME DATA FROM EDITOR
===================================================== */

function updateResumeData() {

    const heading =
        resumePaper.querySelector(".resume-heading");

    if (heading) {

        const h1 = heading.querySelector("h1");

        const job = heading.querySelector(".job-title");

        const contact =
            heading.querySelector(".resume-contact");

        if (h1) resumeData.name = h1.innerText;

        if (job) resumeData.role = job.innerText;

        if (contact) resumeData.contact = contact.innerText;

    }


    const sections =
        resumePaper.querySelectorAll(".resume-section");


    sections.forEach(section => {

        const title =
            section.querySelector("h2")?.innerText.trim();

        const content =
            section.querySelector(".section-content");

        if (!title || !content) return;


        if (title.toLowerCase() === "professional profile") {

            resumeData.summary =
                content.innerText.trim();

        }

        if (title.toLowerCase() === "certifications") {

            resumeData.certifications =
                content.innerText.trim();

        }

        if (title.toLowerCase() === "additional information") {

            resumeData.additional =
                content.innerText.trim();

        }

        if (title.toLowerCase() === "key skills") {

            resumeData.skills =
                [...content.querySelectorAll("li span")]
                .map(el => el.innerText.trim());

        }

        if (title.toLowerCase() === "work experience") {

            resumeData.experience =
                [...content.querySelectorAll(".resume-entry")]
                .map(entry => {

                    const strong = entry.querySelector("strong");

                    const meta = entry.querySelector(".meta");

                    const p = entry.querySelector("p");

                    const metaText = meta?.innerText || "";

                    const split = metaText.split("•");

                    return {

                        position: strong?.innerText || "",

                        company: split[0]?.trim() || "",

                        period: split.slice(1).join("•").trim(),

                        description: p?.innerText || ""

                    };

                });

        }

        if (title.toLowerCase() === "education") {

            resumeData.education =
                [...content.querySelectorAll(".resume-entry")]
                .map(entry => {

                    const strong = entry.querySelector("strong");

                    const meta = entry.querySelector(".meta");

                    const p = entry.querySelector("p");

                    const split =
                        (meta?.innerText || "").split("•");

                    return {

                        degree: strong?.innerText || "",

                        school: split[0]?.trim() || "",

                        period: split.slice(1).join("•").trim(),

                        description: p?.innerText || ""

                    };

                });

        }

    });

}


/* =====================================================
   10. ADD CUSTOM RESUME SECTION
===================================================== */

$("addSection").addEventListener("click", () => {

    const title = prompt("Enter section title:");

    if (!title || !title.trim()) return;

    const section = document.createElement("section");

    section.className = "resume-section";

    section.innerHTML = `

        <h2 contenteditable="true">
            ${escapeHTML(title.trim())}
        </h2>

        <div class="section-content">

            <p contenteditable="true">
                Enter your information here.
            </p>

            <button
                type="button"
                class="delete-section"
            >
                Delete Section
            </button>

        </div>

    `;

    resumePaper.querySelector(".resume-content")
        .appendChild(section);

    section.querySelector(".delete-section")
        .addEventListener("click", () => {

            if (confirm("Delete this section?")) {

                section.remove();

                updateResumeData();

                saveAll();

            }

        });

    bindResumeEvents();

    saveAll();

    showToast("Custom section added.");

});


/* =====================================================
   11. PHOTO UPLOAD
===================================================== */

$("photoUpload").addEventListener("change", event => {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        showToast("Please select an image.");

        return;

    }

    if (file.size > 5 * 1024 * 1024) {

        showToast("Photo must be below 5 MB.");

        return;

    }

    const reader = new FileReader();

    reader.onload = () => {

        photoData = reader.result;

        renderResume();

        saveAll();

        showToast("Photo uploaded successfully.");

    };

    reader.readAsDataURL(file);

});


$("photoSize").addEventListener("change", () => {

    renderResume();

    saveAll();

});


$("photoShape").addEventListener("change", () => {

    renderResume();

    saveAll();

});


$("removePhoto").addEventListener("click", () => {

    photoData = "";

    $("photoUpload").value = "";

    renderResume();

    saveAll();

    showToast("Photo removed.");

});


/* =====================================================
   12. DEFAULT LETTER SAMPLES
===================================================== */

const letterSamples = {

    resignation: `

        <p>[Your Full Name]<br>
        [Your Address]<br>
        [Contact Number]<br>
        [Email Address]</p>

        <p>[Date]</p>

        <p>[Manager's Name]<br>
        [Company Name]<br>
        [Company Address]</p>

        <p>Dear [Manager's Name],</p>

        <p class="letter-title">
            LETTER OF RESIGNATION
        </p>

        <p>
            Please accept this letter as formal notice of my
            resignation from my position as [Job Title] at
            [Company Name], effective [Last Working Day].
        </p>

        <p>
            I appreciate the opportunities, guidance, and
            professional experience I have gained during my
            employment with the company.
        </p>

        <p>
            I will do my best to assist with the transition
            of my responsibilities before my departure.
        </p>

        <p>Thank you for your understanding.</p>

        <p>Sincerely,</p>

        <p>[Your Full Name]</p>

    `,


    promissory: `

        <p>[Your Full Name]<br>
        [Your Address]<br>
        [Contact Number]</p>

        <p>[Date]</p>

        <p>To: [Recipient / Organization]</p>

        <p class="letter-title">
            PROMISSORY NOTE
        </p>

        <p>
            I, [Full Name], acknowledge that I owe
            [Recipient / Organization] the amount of
            [Amount in Figures] ([Amount in Words])
            for [Reason].
        </p>

        <p>
            I promise to pay the amount in full on or before
            [Due Date], or according to the following payment
            schedule: [Payment Details].
        </p>

        <p>
            I understand my responsibility to fulfill this
            commitment according to the agreed terms.
        </p>

        <p>
            Signed this [Day] of [Month, Year] at [Place].
        </p>

        <p>
            ____________________________<br>
            [Name and Signature of Promisor]
        </p>

        <p>Witness: ____________________________</p>

    `,


    excuse: `

        <p>[Your Name]<br>
        [Grade / Position / Department]<br>
        [Date]</p>

        <p>To: [Teacher / Supervisor / Office]</p>

        <p>Dear [Recipient's Name],</p>

        <p class="letter-title">EXCUSE LETTER</p>

        <p>
            Please excuse my [son/daughter/myself],
            [Name], for being unable to attend
            [class/work] on [Date] due to [Reason].
        </p>

        <p>
            I apologize for any inconvenience caused.
            I will make sure that any missed lessons,
            tasks, or responsibilities are completed.
        </p>

        <p>Thank you for your consideration.</p>

        <p>Respectfully,</p>

        <p>[Your Name]</p>

    `,


    authorization: `

        <p>[Your Full Name]<br>
        [Your Address]<br>
        [Contact Number]</p>

        <p>[Date]</p>

        <p>To Whom It May Concern:</p>

        <p class="letter-title">
            AUTHORIZATION LETTER
        </p>

        <p>
            I, [Your Full Name], hereby authorize
            [Authorized Person's Full Name], with valid
            identification [ID Type and Number], to act
            on my behalf for the purpose of
            [Specific Transaction].
        </p>

        <p>
            I am unable to personally complete this
            transaction because [Reason, optional].
        </p>

        <p>
            Attached are copies of the required
            identification documents for verification.
        </p>

        <p>
            This authorization is valid on
            [Date / Validity Period] only.
        </p>

        <p>Thank you for your assistance.</p>

        <p>Sincerely,</p>

        <p>
            ____________________________<br>
            [Your Full Name and Signature]
        </p>

        <p>
            Authorized Representative: __________________
        </p>

    `,


    application: `

        <p>[Your Full Name]<br>
        [Address]<br>
        [Phone Number]<br>
        [Email]</p>

        <p>[Date]</p>

        <p>[Hiring Manager]<br>
        [Company Name]<br>
        [Company Address]</p>

        <p>Dear [Hiring Manager],</p>

        <p class="letter-title">
            APPLICATION FOR [POSITION]
        </p>

        <p>
            I am writing to apply for the position of
            [Position] at [Company Name].
        </p>

        <p>
            My background in [Relevant Experience]
            and skills in [Key Skills] make me a
            strong candidate for this opportunity.
        </p>

        <p>
            I am dependable, willing to learn,
            and committed to producing quality work.
        </p>

        <p>
            Thank you for considering my application.
            I would welcome the opportunity to discuss
            my qualifications.
        </p>

        <p>Sincerely,</p>

        <p>[Your Full Name]</p>

    `,


    request: `

        <p>[Your Full Name]<br>
        [Address]<br>
        [Contact Details]</p>

        <p>[Date]</p>

        <p>[Recipient's Name / Office]<br>
        [Organization]</p>

        <p>Dear [Recipient's Name / Sir / Madam],</p>

        <p class="letter-title">
            REQUEST LETTER
        </p>

        <p>
            I respectfully write to request
            [Clearly State Your Request] for
            [Purpose / Reason].
        </p>

        <p>
            This request is important because
            [Brief Explanation].
        </p>

        <p>
            If approved, I am willing to comply
            with the requirements and procedures
            established by your office.
        </p>

        <p>
            Thank you for your time and consideration.
        </p>

        <p>Respectfully yours,</p>

        <p>[Your Full Name]</p>

    `,


    thankyou: `

        <p>[Your Full Name]<br>
        [Date]</p>

        <p>Dear [Recipient's Name],</p>

        <p class="letter-title">
            LETTER OF APPRECIATION
        </p>

        <p>
            I would like to express my sincere gratitude
            for [Specific Help, Opportunity, or Support].
        </p>

        <p>
            Your assistance made a meaningful difference
            because [Explain Briefly].
        </p>

        <p>
            I truly appreciate the time and effort
            you shared.
        </p>

        <p>With appreciation,</p>

        <p>[Your Full Name]</p>

    `,


    complaint: `

        <p>[Your Full Name]<br>
        [Address]<br>
        [Contact Details]</p>

        <p>[Date]</p>

        <p>[Customer Service / Manager]<br>
        [Company / Organization]</p>

        <p>Dear [Recipient's Name / Sir / Madam],</p>

        <p class="letter-title">
            FORMAL COMPLAINT
        </p>

        <p>
            I am writing to formally raise a concern
            regarding [Product / Service / Incident]
            that occurred on [Date].
        </p>

        <p>
            The issue is as follows:
            [Describe the facts clearly, including
            relevant dates and actions taken].
        </p>

        <p>
            I respectfully request [Specific Resolution].
        </p>

        <p>
            Thank you for your attention.
            I look forward to your response.
        </p>

        <p>Sincerely,</p>

        <p>[Your Full Name]</p>

    `,


    undertaking: `

        <p>[Your Full Name]<br>
        [Address]<br>
        [Date]</p>

        <p>To: [Recipient / Organization]</p>

        <p class="letter-title">
            LETTER OF UNDERTAKING
        </p>

        <p>
            I, [Full Name], hereby undertake and agree
            to [Clearly State the Action, Responsibility,
            or Commitment].
        </p>

        <p>
            I understand that I am responsible for
            completing the stated obligation by
            [Deadline / Conditions].
        </p>

        <p>
            This undertaking is signed on [Date]
            at [Place].
        </p>

        <p>
            ____________________________<br>
            [Full Name and Signature]
        </p>

        <p>Witness: ____________________________</p>

    `,


    recommendation: `

        <p>[Your Name / Position]<br>
        [Organization]<br>
        [Date]</p>

        <p>To Whom It May Concern:</p>

        <p class="letter-title">
            LETTER OF RECOMMENDATION
        </p>

        <p>
            I am pleased to recommend
            [Candidate's Full Name], whom I have known
            in my capacity as [Your Relationship / Position]
            for [Length of Time].
        </p>

        <p>
            During this time, [Candidate's Name]
            demonstrated [Relevant Strengths and Skills].
        </p>

        <p>
            I believe [Candidate's Name] would be
            a valuable addition to [Company / Program].
        </p>

        <p>Sincerely,</p>

        <p>[Your Name]<br>
        [Position and Contact Details]</p>

    `,


    cover: `

        <p>[Your Full Name]<br>
        [Address]<br>
        [Phone]<br>
        [Email]</p>

        <p>[Date]</p>

        <p>[Hiring Manager]<br>
        [Company Name]</p>

        <p>Dear [Hiring Manager],</p>

        <p class="letter-title">
            COVER LETTER — [POSITION]
        </p>

        <p>
            I am pleased to submit my application
            for the [Position] role at [Company Name].
        </p>

        <p>
            My experience in [Field / Industry]
            has helped me develop strengths in
            [Relevant Skills].
        </p>

        <p>
            I am particularly interested in joining
            [Company Name] because [Genuine Reason].
        </p>

        <p>
            Thank you for your time and consideration.
        </p>

        <p>Sincerely,</p>

        <p>[Your Full Name]</p>

    `,


    custom: `

        <p>[Your Full Name]<br>
        [Your Address]<br>
        [Contact Details]</p>

        <p>[Date]</p>

        <p>[Recipient's Name]<br>
        [Organization / Address]</p>

        <p>Dear [Recipient's Name / Sir / Madam],</p>

        <p class="letter-title">
            [SUBJECT / LETTER TITLE]
        </p>

        <p>
            [Write your opening paragraph.
            Clearly explain why you are writing.]
        </p>

        <p>
            [Add important details, supporting
            information, and your request.]
        </p>

        <p>
            [Close politely and include next steps.]
        </p>

        <p>Respectfully,</p>

        <p>[Your Full Name]</p>

    `

};


/* =====================================================
   13. LETTER SELECTION
===================================================== */

function loadLetter() {

    const type = $("letterType").value;

    letterPaper.innerHTML = letterSamples[type];

    applyLetterFormatting();

    bindLetterEvents();

    saveAll();

}


/* =====================================================
   14. LETTER FORMATTING
===================================================== */

function applyLetterFormatting() {

    letterPaper.style.fontFamily =
        $("letterFont").value;

    letterPaper.style.fontSize =
        $("letterFontSize").value + "pt";

}

function bindLetterEvents() {

    letterPaper.addEventListener("input", scheduleSave);

}

$("letterFont").addEventListener("change", () => {

    applyLetterFormatting();

    saveAll();

});

$("letterFontSize").addEventListener("change", () => {

    applyLetterFormatting();

    saveAll();

});

$("letterType").addEventListener("change", loadLetter);


/* =====================================================
   15. RESTORE LETTER SAMPLE
===================================================== */

$("restoreLetter").addEventListener("click", () => {

    if (!confirm("Restore this letter sample?")) return;

    loadLetter();

    showToast("Letter sample restored.");

});


/* =====================================================
   16. INSERT TODAY'S DATE
===================================================== */

$("insertDate").addEventListener("click", () => {

    const date = new Date().toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

    const p = document.createElement("p");

    p.textContent = date;

    letterPaper.prepend(p);

    saveAll();

    showToast("Date inserted.");

});


/* =====================================================
   17. SWITCH DOCUMENT MODE
===================================================== */

function switchMode(mode) {

    document.querySelectorAll(".tab")
        .forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.mode === mode
            );

        });

    $("resumeMode").classList.toggle(
        "hidden",
        mode !== "resume"
    );

    $("letterMode").classList.toggle(
        "hidden",
        mode !== "letter"
    );

    saveAll();

}

document.querySelectorAll(".tab").forEach(tab => {

    tab.addEventListener("click", () => {

        switchMode(tab.dataset.mode);

    });

});


/* =====================================================
   18. AUTO SAVE
===================================================== */

function scheduleSave() {

    $("saveStatus").textContent = "Saving...";

    clearTimeout(saveTimer);

    saveTimer = setTimeout(saveAll, 500);

}


function saveAll() {

    try {

        updateResumeData();

        const activeMode =
            document.querySelector(".tab.active")
                ?.dataset.mode || "resume";

        const savedData = {

            mode: activeMode,

            template: currentTemplate,

            resumeData,

            resumeHTML: resumePaper.innerHTML,

            letterHTML: letterPaper.innerHTML,

            letterType: $("letterType").value,

            letterFont: $("letterFont").value,

            letterFontSize: $("letterFontSize").value,

            photoData,

            photoSize: $("photoSize").value,

            photoShape: $("photoShape").value

        };

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(savedData)
        );

        $("saveStatus").textContent =
            "Saved on this device";

    } catch (error) {

        console.error(error);

        $("saveStatus").textContent =
            "Storage full or unavailable";

    }

}


/* =====================================================
   19. RESTORE SAVED DOCUMENT
===================================================== */

function restoreSaved() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return false;

        const data = JSON.parse(saved);

        if (data.resumeData) {

            resumeData = {

                ...JSON.parse(JSON.stringify(defaultResume)),

                ...data.resumeData

            };

        }

        currentTemplate =
            Number.isInteger(data.template)
                ? Math.max(0, Math.min(9, data.template))
                : 0;

        photoData = data.photoData || "";

        $("photoSize").value =
            data.photoSize || "2x2";

        $("photoShape").value =
            data.photoShape || "circle";

        $("letterType").value =
            data.letterType || "resignation";

        $("letterFont").value =
            data.letterFont || "Arial";

        $("letterFontSize").value =
            data.letterFontSize || "11";

        renderTemplates();

        if (data.resumeHTML) {

            resumePaper.innerHTML = data.resumeHTML;

        } else {

            renderResume();

        }

        if (data.letterHTML) {

            letterPaper.innerHTML = data.letterHTML;

        } else {

            loadLetter();

        }

        applyLetterFormatting();

        bindResumeEvents();

        bindLetterEvents();

        switchMode(data.mode || "resume");

        return true;

    } catch (error) {

        console.error("Restore error:", error);

        return false;

    }

}


/* =====================================================
   20. RESTORE SAMPLE RESUME
===================================================== */

$("restoreResume").addEventListener("click", () => {

    if (!confirm(
        "Restore the sample resume? Current resume edits will be replaced."
    )) return;

    resumeData = JSON.parse(
        JSON.stringify(defaultResume)
    );

    photoData = "";

    $("photoUpload").value = "";

    currentTemplate = 0;

    renderTemplates();

    renderResume();

    saveAll();

    showToast("Sample resume restored.");

});


/* =====================================================
   21. NEW DOCUMENT
===================================================== */

$("newDocument").addEventListener("click", () => {

    if (!confirm(
        "Start a new document? This clears the current saved work."
    )) return;

    localStorage.removeItem(STORAGE_KEY);

    resumeData = JSON.parse(
        JSON.stringify(defaultResume)
    );

    photoData = "";

    currentTemplate = 0;

    $("photoUpload").value = "";

    $("photoSize").value = "2x2";

    $("photoShape").value = "circle";

    $("letterType").value = "resignation";

    renderTemplates();

    renderResume();

    loadLetter();

    switchMode("resume");

    saveAll();

    showToast("New document created.");

});


/* =====================================================
   22. SAVE DOCUMENT + PRINT SAVED COPY ONLY
===================================================== */

const SAVED_RESUME_KEY = STORAGE_KEY + "_saved_resume";
const SAVED_LETTER_KEY = STORAGE_KEY + "_saved_letter";
let printRestoreHTML = null;
let printRestoreClassName = null;
let printRestoreLetterStyle = null;

function saveCurrentDocument() {
    saveAll();

    const activeMode = document.querySelector(".tab.active")?.dataset.mode || "resume";
    try {
        if (activeMode === "resume") {
            const snapshot = {
                type: "resume",
                html: resumePaper.innerHTML,
                className: resumePaper.className,
                template: currentTemplate,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(SAVED_RESUME_KEY, JSON.stringify(snapshot));
            showToast("Resume saved. You can print the saved resume anytime.");
        } else {
            const snapshot = {
                type: "letter",
                html: letterPaper.innerHTML,
                font: letterPaper.style.fontFamily || $("letterFont").value,
                fontSize: letterPaper.style.fontSize || $("letterFontSize").value + "pt",
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(SAVED_LETTER_KEY, JSON.stringify(snapshot));
            showToast("Letter saved. You can print the saved letter anytime.");
        }
        $("saveStatus").textContent = activeMode === "resume" ? "Resume saved" : "Letter saved";
    } catch (error) {
        console.error("Save document error:", error);
        showToast("Unable to save. Device storage may be full.");
    }
}

$("saveCurrentDocument").addEventListener("click", saveCurrentDocument);

function printSavedDocument(type) {
    const key = type === "resume" ? SAVED_RESUME_KEY : SAVED_LETTER_KEY;
    let saved;
    try {
        saved = JSON.parse(localStorage.getItem(key) || "null");
    } catch (error) {
        saved = null;
    }

    if (!saved || !saved.html) {
        showToast(`No saved ${type} found. Open ${type === "resume" ? "Resume Builder" : "Letter Writer"}, then tap Save Current first.`);
        return;
    }

    saveAll(); // Preserve the current working draft; printing uses the saved snapshot below.
    printRestoreHTML = type === "resume" ? resumePaper.innerHTML : letterPaper.innerHTML;
    printRestoreClassName = resumePaper.className;
    printRestoreLetterStyle = {
        fontFamily: letterPaper.style.fontFamily,
        fontSize: letterPaper.style.fontSize
    };

    if (type === "resume") {
        resumePaper.innerHTML = saved.html;
        resumePaper.className = saved.className || "resume-paper";
    } else {
        letterPaper.innerHTML = saved.html;
        letterPaper.style.fontFamily = saved.font || "Arial";
        letterPaper.style.fontSize = saved.fontSize || "11pt";
    }

    document.body.classList.remove("print-resume", "print-letter");
    document.body.classList.add(type === "resume" ? "print-resume" : "print-letter");

    // Allow the browser to apply the print-only layout before opening the dialog.
    requestAnimationFrame(() => window.print());
}

$("printResumeNow").addEventListener("click", () => printSavedDocument("resume"));
$("printLetterNow").addEventListener("click", () => printSavedDocument("letter"));

window.addEventListener("afterprint", () => {
    if (printRestoreHTML !== null) {
        if (document.body.classList.contains("print-resume")) {
            resumePaper.innerHTML = printRestoreHTML;
            resumePaper.className = printRestoreClassName || "resume-paper";
            bindResumeEvents();
        } else if (document.body.classList.contains("print-letter")) {
            letterPaper.innerHTML = printRestoreHTML;
            letterPaper.style.fontFamily = printRestoreLetterStyle?.fontFamily || "";
            letterPaper.style.fontSize = printRestoreLetterStyle?.fontSize || "";
            bindLetterEvents();
        }
        printRestoreHTML = null;
        printRestoreClassName = null;
        printRestoreLetterStyle = null;
    }
    document.body.classList.remove("print-resume", "print-letter");
});


/* =====================================================
   23. ZOOM CONTROLS
===================================================== */

function updateZoom() {

    resumePaper.style.transform =
        `scale(${zoomLevel})`;

    resumePaper.style.marginBottom =
        `${(zoomLevel - 1) * 1123}px`;

    $("zoomValue").textContent =
        Math.round(zoomLevel * 100) + "%";

}

$("zoomIn").addEventListener("click", () => {

    zoomLevel = Math.min(1.2, zoomLevel + 0.05);

    updateZoom();

});

$("zoomOut").addEventListener("click", () => {

    zoomLevel = Math.max(0.65, zoomLevel - 0.05);

    updateZoom();

});


/* =====================================================
   24. TOAST NOTIFICATION
===================================================== */

let toastTimer;

function showToast(message) {

    const toast = $("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* =====================================================
   25. INITIALIZE APPLICATION
===================================================== */

function initializeApp() {

    renderTemplates();

    renderResume();

    loadLetter();

    const restored = restoreSaved();

    if (!restored) {

        saveAll();

    }

    console.log(
        "LinkTech Resume and Letters initialized."
    );

}

initializeApp();


/* =====================================================
   END OF LINKTECH RESUME AND LETTERS
===================================================== */
