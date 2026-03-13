import os

def render_input(id, label, placeholder=""):
    return f'''
                    <div class="input-group">
                        <label>{label}</label>
                        <input type="text" id="{id}" placeholder="{placeholder}">
                    </div>'''

def render_textarea(id, label, rows=3, placeholder=""):
    return f'''
                    <div class="input-group">
                        <label>{label}</label>
                        <textarea id="{id}" rows="{rows}" placeholder="{placeholder}"></textarea>
                    </div>'''

def render_checkboxes(group_name, options):
    html = f'<div class="input-group"><label>{group_name}</label><div style="display:flex; flex-wrap:wrap; gap:10px;">'
    for opt in options:
        tid = opt.lower().replace(' ', '_')
        html += f'<label style="font-weight:normal; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="chk_{tid}"> {opt}</label>'
    html += '</div></div>'
    return html

def render_phases(options):
    html = '<div class="input-group"><label>Event Phases & Checklist</label><ul class="premium-checklist">'
    for opt in options:
        tid = opt.lower().replace(' ', '_')
        html += f'''
            <li onclick="const chk=this.querySelector('input'); chk.checked=!chk.checked; saveData();">
                <input type="checkbox" id="phase_{tid}" onclick="event.stopPropagation(); saveData();">
                <span>{opt}</span>
            </li>'''
    html += '</ul></div>'
    return html

pages = [
    # Page 1: Cover & Welcome
    {
        "front": '''
                    <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; height:100%; padding-bottom:40px;">
                        <img src="reign_logo.png" alt="REIGN Logo" style="max-width:85%; max-height:60%; object-fit:contain; margin-bottom:20px;">
                        <h2 style="color:var(--primary); font-weight:800; letter-spacing:1px; margin:0; font-size:32px;">COUNCIL WORKBOOK</h2>
                        <h3 style="color:var(--accent2); margin-top:10px;">RI YEAR 2026-27 | RID 3131</h3>
                    </div>''',
        "back": '''
                    <h1>WELCOME</h1>
                    <p>Welcome, leaders of District 3131! This workbook is your essential companion for the REIGN year. We are dedicated to empowering every individual for collective growth and networking excellence.</p>
                    <p>As we embark on this journey together, remember that leadership is not just about a title; it's about the impact you create. This workbook will guide you in standardizing operations, evaluating performance, and planning a truly impactful year.</p>
                    <p style="font-weight:bold; color:var(--primary); margin-top:auto;">DRR Dr. Karishma Awari</p>'''
    },
    # Page 2: Profile & Rotaract Why
    {
        "front": f'''
                    <h1 style="font-size: 24px;">YOUR PROFILE</h1>
                    {render_input("prof_name", "Full Name", "Enter your full name")}
                    {render_input("prof_club", "Rotaract Club", "Your club name")}
                    {render_input("prof_pos", "Council Position")}
                    {render_input("prof_blood", "Blood Group")}
                    {render_input("prof_dob", "Date of Birth (DD-MM)")}''',
        "back": f'''
                    <h1 style="font-size: 24px;">MY ROTARACT "WHY"</h1>
                    <p>Understanding your core motivation helps sustain your passion.</p>
                    {render_textarea("why_joined", "The reason I joined (or stay engaged) is:", 4, "Share your motivation...")}
                    {render_textarea("why_council", "Why I took up this district council role:", 4)}'''
    },
    # Page 3: Aspirations & Core Values
    {
        "front": f'''
                    <h1 style="font-size: 24px;">MY ASPIRATIONS</h1>
                    {render_input("asp_1", "One thing I hope to achieve for my Club/District:")}
                    {render_input("asp_2", "One thing I hope to achieve for myself:")}
                    {render_textarea("asp_legacy", "The legacy I want to leave behind this year:", 3)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">VALUES & BELIEFS</h1>
                    <p>Select the top values that will guide your leadership this year:</p>
                    {render_checkboxes("Core Values", ["Integrity", "Service", "Fellowship", "Diversity", "Leadership", "Innovation", "Accountability", "Empathy", "Excellence"])}
                    {render_textarea("values_impl", "How will you demonstrate these values in your daily actions?", 3)}'''
    },
    # Page 4: Leadership Qualities & Future Goals
    {
        "front": f'''
                    <h1 style="font-size: 24px;">LEADERSHIP QUALITIES</h1>
                    <p>Rate yourself (1-10) and identify areas for improvement.</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        {render_input("rate_comm", "Communication")}
                        {render_input("rate_emp", "Empathy")}
                        {render_input("rate_vis", "Vision/Strategy")}
                        {render_input("rate_tech", "Technical Skills")}
                    </div>
                    {render_textarea("leadership_improve", "What is one specific leadership quality you want to drastically improve?", 2)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">FUTURE GOALS</h1>
                    <p>Where do you see yourself taking this journey?</p>
                    {render_textarea("goal_1yr", "1-Year Rotaract Goal", 2)}
                    {render_textarea("goal_3yr", "3-Year Professional/Personal Goal", 2)}
                    {render_textarea("goal_align", "How does your current role bridge the gap to these future goals?", 3)}'''
    },
    # Page 5: SMART Goals
    {
        "front": f'''
                    <h1 style="font-size: 24px;">SMART GOALS (1/2)</h1>
                    <p>Setting clear and achievable goals is essential for success.</p>
                    {render_textarea("smart_s", "S - Specific (What exactly do you want to accomplish?)", 3)}
                    {render_textarea("smart_m", "M - Measurable (How will you measure your progress?)", 3)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">SMART GOALS (2/2)</h1>
                    {render_textarea("smart_a", "A - Attainable (Is it realistic given your resources?)", 3)}
                    {render_textarea("smart_r", "R - Relevant (Why does this goal matter right now?)", 3)}
                    {render_input("smart_t", "T - Time-bound (What is your deadline?)")}'''
    },
    # Page 6: Challenges & Solutions
    {
        "front": f'''
                    <h1 style="font-size: 24px;">ANTICIPATING CHALLENGES</h1>
                    <p>Every journey has roadblocks. Let's identify them early.</p>
                    {render_textarea("chal_time", "Time/Resource constraints I might face:", 2)}
                    {render_textarea("chal_team", "Team or communication barriers:", 2)}
                    {render_textarea("chal_other", "Other external obstacles:", 2)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">PROPOSED SOLUTIONS</h1>
                    <p>For every challenge, there is a proactive solution.</p>
                    {render_textarea("sol_time", "How I will manage my time/resources:", 2)}
                    {render_textarea("sol_team", "Strategies to improve team dynamics:", 2)}
                    {render_textarea("sol_support", "Who can I ask for help/mentorship?", 2)}'''
    },
    # Page 7: Skill Development
    {
        "front": f'''
                    <h1 style="font-size: 24px;">SKILL DEVELOPMENT</h1>
                    <p>Continuous learning is the hallmark of a great leader.</p>
                    {render_input("skill_1", "Primary skill I need to acquire/hone:")}
                    {render_textarea("skill_1_plan", "My action plan to develop this skill:", 2)}
                    {render_input("skill_2", "Secondary skill of interest:")}
                    {render_textarea("skill_2_plan", "My action plan to develop this skill:", 2)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">TEAM COLLABORATION</h1>
                    <p>"None of us is as smart as all of us."</p>
                    {render_textarea("collab_style", "Describe your preferred working/collaboration style:", 3)}
                    {render_textarea("collab_conflict", "How do you typically handle disagreements within a team?", 3)}
                    {render_input("collab_tool", "Favorite team management tool (e.g., Trello, Slack):")}'''
    },
    # Page 8: Feedback & Reflection
    {
        "front": f'''
                    <h1 style="font-size: 24px;">FEEDBACK & REFLECTION</h1>
                    <p>Feedback is the breakfast of champions.</p>
                    {render_textarea("feedback_rx", "How do you react to constructive criticism?", 3)}
                    {render_textarea("feedback_give", "What is your approach to giving feedback to peers?", 3)}
                    {render_input("feedback_freq", "How often will you review your own performance? (e.g., Weekly, Monthly)")}''',
        "back": f'''
                    <h1 style="font-size: 24px;">NETWORKING & RELATIONSHIPS</h1>
                    <p>Networking is about farming, not hunting.</p>
                    {render_textarea("network_conn", "Who are 3 key people you want to connect with this year?", 3)}
                    {render_textarea("network_value", "What value can you bring to these relationships?", 3)}
                    {render_input("network_mentor", "Name a potential mentor you wish to learn from:")}'''
    },
    # Page 9: Event & Project Management
    {
        "front": f'''
                    <h1 style="font-size: 24px;">EVENT PLANNING</h1>
                    <p>A quick checklist for your next major event.</p>
                    {render_phases(["Objective defined", "Budget approved", "Venue secured", "Marketing started", "Logistics planned", "Post-event review scheduled"])}
                    {render_textarea("event_idea", "One flagship event idea for this year:", 2)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">PROJECT MANAGEMENT</h1>
                    <p>Track your core district initiative.</p>
                    {render_input("proj_name", "Initiative Name")}
                    {render_input("proj_kpi", "Key Performance Indicator (KPI)")}
                    {render_textarea("proj_milestones", "List 3 major milestones for this initiative:", 3)}'''
    },
    # Page 10: Public Speaking & Conflict
    {
        "front": f'''
                    <h1 style="font-size: 24px;">PUBLIC SPEAKING</h1>
                    <p>Your voice has power. Prepare to use it.</p>
                    {render_textarea("speak_topics", "Topics you feel confident speaking about:", 3)}
                    {render_textarea("speak_fear", "What is your biggest fear regarding public speaking and how will you overcome it?", 3)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">CONFLICT RESOLUTION</h1>
                    <p>Resolving disputes amicably keeps the team focused.</p>
                    {render_textarea("conflict_scenario", "Describe a past conflict and how it was resolved:", 3)}
                    {render_textarea("conflict_approach", "Your standard protocol for resolving future conflicts:", 3)}'''
    },
    # Page 11: Time Management & Delegation
    {
        "front": f'''
                    <h1 style="font-size: 24px;">TIME MANAGEMENT</h1>
                    <p>Manage your energy, not just your time.</p>
                    {render_textarea("time_wasters", "Identify your top 2 biggest time-wasters:", 2)}
                    {render_textarea("time_tactics", "Tactics to minimize distractions (e.g., Pomodoro, Time-blocking):", 3)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">DELEGATION</h1>
                    <p>Delegation empowers others while freeing you to lead.</p>
                    {render_textarea("delegate_what", "Tasks you should immediately delegate:", 3)}
                    {render_textarea("delegate_who", "Who on your team is ready for these responsibilities?", 3)}'''
    },
    # Page 12: Strategy & Problem Solving
    {
        "front": f'''
                    <h1 style="font-size: 24px;">STRATEGIC PLANNING</h1>
                    <p>Looking at the big picture.</p>
                    {render_textarea("strat_swot", "What is the biggest opportunity for District 3131 right now?", 3)}
                    {render_textarea("strat_risk", "What is the biggest threat we must mitigate?", 3)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">PROBLEM-SOLVING</h1>
                    <p>Innovation requires creative problem-solving.</p>
                    {render_textarea("prob_process", "What is your step-by-step process when faced with an unexpected crisis?", 4)}
                    {render_input("prob_quote", "Your favorite motivational quote for tough times:")}'''
    },
    # Page 13: Action Plan 1 & Conduct
    {
        "front": f'''
                    <h1 style="font-size: 24px;">ACTION PLAN (H1)</h1>
                    <p>First half of the year focus.</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        {render_input("act_jul", "Jul:")}
                        {render_input("act_aug", "Aug:")}
                        {render_input("act_sep", "Sep:")}
                        {render_input("act_oct", "Oct:")}
                        {render_input("act_nov", "Nov:")}
                        {render_input("act_dec", "Dec:")}
                    </div>''',
        "back": f'''
                    <h1 style="font-size: 24px;">ACTION PLAN (H2)</h1>
                    <p>Second half of the year focus.</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        {render_input("act_jan", "Jan:")}
                        {render_input("act_feb", "Feb:")}
                        {render_input("act_mar", "Mar:")}
                        {render_input("act_apr", "Apr:")}
                        {render_input("act_may", "May:")}
                        {render_input("act_jun", "Jun:")}
                    </div>'''
    },
    # Page 14: Four-Way Test & Growth
    {
        "front": f'''
                    <h1 style="font-size: 24px;">FOUR-WAY TEST</h1>
                    <p>Of the things we think, say or do:</p>
                    <ul style="list-style: none; margin-bottom: 20px;">
                        <li style="margin-bottom: 5px;">1. Is it the <strong>TRUTH</strong>?</li>
                        <li style="margin-bottom: 5px;">2. Is it <strong>FAIR</strong> to all concerned?</li>
                        <li style="margin-bottom: 5px;">3. Will it build <strong>GOODWILL</strong>/<strong>FRIENDSHIPS</strong>?</li>
                        <li style="margin-bottom: 5px;">4. Will it be <strong>BENEFICIAL</strong> to all concerned?</li>
                    </ul>
                    {render_textarea("four_way_apply_2", "How will I apply this in my role?", 2)}''',
        "back": f'''
                    <h1 style="font-size: 24px;">PERSONAL COMMITMENT</h1>
                    <p>Write a commitment statement for the year.</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border: 2px dashed var(--accent2);">
                        <p style="font-style: italic; margin-bottom: 0; font-size:14px;">"I am committed to achieving these goals by staying focused, upholding Rotaract values, and empowering individuals for growth and networking."</p>
                    </div>
                    {render_input("signature", "Your Name & Signature (Type Name)")}'''
    },
    # Page 15: Workbook Curators
    {
        "front": '''
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="font-size: 26px; color: #1a1a1a; letter-spacing: 3px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid var(--accent2); display: inline-block; padding-bottom: 5px;">WORKBOOK CURATORS 📘</h2>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 25px; padding: 0 10px;">
                        <!-- Curator 1 -->
                        <div style="display: flex; align-items: flex-start; gap: 20px;">
                            <div style="width: 100px; height: 130px; border-radius: 15px; background: #f0f0f0; flex-shrink: 0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #ddd;">
                                <img src="curator_dwijesh.jpg" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'height:100%; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px;\\'>PHOTO</div>'" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="padding-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #f1c40f; font-size: 24px;">✦</span>
                                    <h4 style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">PHF. Dwijesh Nashikkar</h4>
                                </div>
                                <p style="margin: 3px 0 0 32px; font-size: 14px; font-weight: 600; color: #444;">District Rotaract Representative</p>
                                <p style="margin: 2px 0 0 32px; font-size: 12px; color: #777;">RIY 2025-26</p>
                            </div>
                        </div>
                        <!-- Curator 2 -->
                        <div style="display: flex; align-items: flex-start; gap: 20px;">
                            <div style="width: 100px; height: 130px; border-radius: 15px; background: #f0f0f0; flex-shrink: 0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #ddd;">
                                <img src="curator_drishti.jpg" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'height:100%; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px;\\'>PHOTO</div>'" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="padding-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #f1c40f; font-size: 24px;">✦</span>
                                    <h4 style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">PHF. IPDRR Drishti Singh</h4>
                                </div>
                                <p style="margin: 3px 0 0 32px; font-size: 14px; font-weight: 600; color: #444;">District Learning Facilitator</p>
                                <p style="margin: 2px 0 0 32px; font-size: 12px; color: #777;">RIY 2025-26</p>
                            </div>
                        </div>
                        <!-- Curator 3 -->
                        <div style="display: flex; align-items: flex-start; gap: 20px;">
                            <div style="width: 100px; height: 130px; border-radius: 15px; background: #f0f0f0; flex-shrink: 0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #ddd;">
                                <img src="curator_amisha.jpg" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'height:100%; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px;\\'>PHOTO</div>'" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div style="padding-top: 10px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="color: #f1c40f; font-size: 24px;">✦</span>
                                    <h4 style="margin: 0; color: #1a1a1a; font-size: 18px; font-weight: 700;">Rtr. Amisha Chaudhan</h4>
                                </div>
                                <p style="margin: 3px 0 0 32px; font-size: 14px; font-weight: 600; color: #444;">District Event Chairperson</p>
                                <p style="margin: 2px 0 0 32px; font-size: 12px; color: #777;">District Team Learning Seminar | RIY 2025-26</p>
                            </div>
                        </div>
                    </div>
                    <p style="text-align: center; font-size: 12px; color: #ccc; margin-top: auto; letter-spacing: 5px;">3 0</p>
                ''',
        "back": '''
                    <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; height:100%; padding: 40px;">
                        <img src="reign_logo.png" style="width: 120px; margin-bottom: 25px; opacity:0.8;">
                        <h3 style="color:var(--primary); font-size: 24px; letter-spacing: 2px; margin-bottom: 15px;">ACKNOWLEDGMENTS</h3>
                        <p style="font-size: 16px; line-height: 1.6; color: #555;">Special thanks to the District Team 3131 for their tireless efforts in creating this interactive digital experience for our leaders.</p>
                        <div style="margin-top: 30px; padding: 25px; border-top: 1px solid #eee; width: 90%;">
                             <p style="font-size: 14px; font-style: italic; color: #888;">"Leadership is the capacity to translate vision into reality."</p>
                        </div>
                    </div>
                '''
    },
    # Page 16: Back Cover
    {
        "front": '''
                    <div style="text-align: center; height:100%; display:flex; flex-direction:column; justify-content:center;">
                        <h1 style="font-size: 36px; color:var(--primary);">CONGRATULATIONS</h1>
                        <p style="font-size: 18px;">You have mapped out your year of REIGN.</p>
                        <p>Keep this workbook updated, reflect on it often, and let it guide you to greatness!</p>
                        <button class="btn" style="align-self: center; margin-top:20px;" onclick="window.open('certificate.html', '_blank')">Save & Generate Certificate</button>
                    </div>''',
        "back": '''
                    <div style="text-align: center; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                        <img src="reign_logo.png" alt="REIGN Logo" style="width: 250px; opacity: 0.8; margin-bottom: 30px;">
                        <h2 style="color:var(--accent2);">EMPOWER. GROW. NETWORK.</h2>
                        <p style="font-weight:600;">Rotaract District 3131</p>
                        <p>RIY 2026-27</p>
                    </div>'''
    }
]

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REIGN Council Workbook - RIY 2026-27</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div id="orientation-hint" style="display:none; position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:10px 20px; border-radius:20px; z-index:9999; font-size:14px; text-align:center; pointer-events:none;">
        Rotate device for better view ↻
    </div>

    <!-- Sync Status -->
    <div id="sync-status" style="position:fixed; top:20px; right:20px; background:rgba(40, 167, 69, 0.9); color:white; padding:8px 15px; border-radius:20px; font-size:12px; font-weight:600; display:none; align-items:center; gap:8px; z-index:9999; box-shadow:0 4px 10px rgba(0,0,0,0.1); pointer-events:none; transition:opacity 0.3s;">
        <span>✓ Changes Synced</span>
    </div>

    <!-- Swipe Hint -->
    <div id="swipe-hint" style="display:none; position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--primary); color:white; padding:10px 25px; border-radius:30px; z-index:9999; font-size:16px; font-weight:bold; align-items:center; gap:10px; pointer-events:none; transition:opacity 0.5s; box-shadow:var(--shadow);">
        <span>Swipe to flip pages</span>
        <span style="font-size:24px; animation: swipeAnim 1.5s infinite;">👈</span>
    </div>

    <!-- Login Overlay -->
    <div id="login-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:var(--background); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <div style="background:var(--white); padding:40px; border-radius:15px; box-shadow:var(--shadow); text-align:center; max-width:400px; width:90%;">
            <img src="reign_logo.png" alt="REIGN Logo" style="width:150px; margin-bottom:20px;">
            <h2 style="color:var(--primary); margin-bottom:10px;">Welcome Delegate!</h2>
            <p style="margin-bottom:20px;">Please enter your registered **Rotary ID** to load your pre-filled workbook.</p>
            <div class="input-group" style="text-align:left;">
                <label>Rotary ID</label>
                <input type="text" id="login_id" placeholder="e.g. 12345678" onkeypress="if(event.key === 'Enter') performLogin()">
            </div>
            <button class="btn" style="width:100%;" onclick="performLogin()">Access Workbook</button>
        </div>
    </div>

    <div class="book-container">
        <div id="book" class="book">
{pages_html}
        </div>

        <div class="nav-controls">
            <button class="nav-btn" onclick="prevPage()">&larr;</button>
            <button class="nav-btn" onclick="nextPage()">&rarr;</button>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
"""

pages_html = ""
for i, page in enumerate(pages):
    
    watermark_html = '<img src="reign_logo.png" class="logo-watermark" alt="Watermark">'
    
    front_content = watermark_html + page["front"]
    back_content = watermark_html + page["back"]
        
    pages_html += f'''
            <!-- Paper {i+1} -->
            <div id="p{i+1}" class="page">
                <div class="front">
{front_content}
                </div>
                <div class="back">
{back_content}
                </div>
            </div>'''

with open("c:/Users/Hobbit/.gemini/antigravity/playground/ecliptic-void/index.html", "w", encoding="utf-8") as f:
    f.write(html_template.replace("{pages_html}", pages_html))

print("Created 16 leaves (32 sides).")
