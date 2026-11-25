import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('diagrams_temp', exist_ok=True)

# Set common font and style
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 9

def generate_dfd_level0():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Central Process
    proc = patches.FancyBboxPatch((35, 38), 30, 24, boxstyle="round,pad=1,rounding_size=4",
                                  facecolor='#1E3A8A', edgecolor='#0F172A', linewidth=2)
    ax.add_patch(proc)
    ax.text(50, 52, "0.0\nEVENTRA SYSTEM", color='white', weight='bold', fontsize=12, ha='center', va='center')
    ax.text(50, 43, "Campus Event Management Platform", color='#93C5FD', fontsize=8.5, ha='center', va='center')

    # External Entities (Rectangles)
    def draw_entity(x, y, w, h, title, subtitle):
        box = patches.FancyBboxPatch((x, y), w, h, boxstyle="square,pad=0.5",
                                     facecolor='#F1F5F9', edgecolor='#1E3A8A', linewidth=2)
        ax.add_patch(box)
        ax.text(x + w/2, y + h*0.65, title, weight='bold', fontsize=10, ha='center', va='center', color='#0F172A')
        ax.text(x + w/2, y + h*0.35, subtitle, fontsize=8, ha='center', va='center', color='#475569')

    # Student (Top Left)
    draw_entity(5, 70, 24, 18, "STUDENT", "Undergrad / Postgrad")
    # Club Organiser (Bottom Left)
    draw_entity(5, 12, 24, 18, "CLUB ORGANISER", "Campus Societies")
    # Admin (Top Right)
    draw_entity(71, 70, 24, 18, "ADMINISTRATOR", "Deans & Facility Admin")
    # External Calendar (Bottom Right)
    draw_entity(71, 12, 24, 18, "EXTERNAL CALENDAR", "Google / Apple / Outlook")

    # Arrows and Labels
    # Student to System
    ax.annotate("", xy=(35, 55), xytext=(29, 75),
                arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.5))
    ax.text(26, 68, "Credentials, Bookings, Timetable\nViolation Reports", fontsize=7.5, color='#1E40AF', rotation=30)

    # System to Student
    ax.annotate("", xy=(29, 71), xytext=(35, 51),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(32, 59, "QR Passes, Match % Feed\nLecture Clash Alerts", fontsize=7.5, color='#047857', rotation=30)

    # Organiser to System
    ax.annotate("", xy=(35, 45), xytext=(29, 25),
                arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.5))
    ax.text(24, 34, "Event Proposals, Poster Files\nGate QR Scans, Bookings", fontsize=7.5, color='#1E40AF', rotation=-30)

    # System to Organiser
    ax.annotate("", xy=(29, 21), xytext=(35, 41),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(32, 26, "Approval Status, Roster CSV\nClash Alerts & Remedies", fontsize=7.5, color='#047857', rotation=-30)

    # Admin to System
    ax.annotate("", xy=(65, 55), xytext=(71, 75),
                arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.5))
    ax.text(71, 66, "Approvals, Overrides, Blackouts\nReport Resolutions", fontsize=7.5, color='#1E40AF', rotation=-30, ha='right')

    # System to Admin
    ax.annotate("", xy=(71, 71), xytext=(65, 51),
                arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(67, 59, "Pending Events, Clash Audits\nCampus Analytics Reports", fontsize=7.5, color='#047857', rotation=-30, ha='right')

    # System to External Calendar
    ax.annotate("", xy=(71, 22), xytext=(65, 44),
                arrowprops=dict(arrowstyle="->", color='#7C3AED', lw=1.5))
    ax.text(72, 34, "RFC 5545 .ics Calendar Stream\n(Google/Apple/Outlook Sync)", fontsize=7.5, color='#6D28D9', rotation=30, ha='right')

    plt.title("Level 0: Eventra Context Data Flow Diagram", fontsize=13, weight='bold', pad=15, color='#1E3A8A')
    plt.tight_layout()
    plt.savefig('diagrams_temp/dfd_level0.png', dpi=200, bbox_inches='tight')
    plt.close()
    print("Level 0 DFD generated.")

def generate_dfd_level1():
    fig, ax = plt.subplots(figsize=(11, 8.5), dpi=200)
    ax.set_xlim(0, 110)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Draw Subsystem Processes (Circles / Rounded Rectangles)
    subsystems = [
        ("1.0", "Auth, RBAC &\nProfiles", 15, 82),
        ("2.0", "Event Lifecycle &\nModeration", 50, 82),
        ("3.0", "Venue Directory &\nScheduling", 85, 82),
        ("4.0", "Clash Validation\nEngine", 85, 52),
        ("5.0", "Discovery &\nRelevance Feed", 15, 52),
        ("6.0", "Registration, Waitlist\n& QR Check-In", 50, 52),
        ("7.0", "Multi-Channel\nNotifications", 15, 20),
        ("8.0", "Personal Calendar &\nTimetable Clash", 50, 20),
        ("9.0", "Admin Command &\nAnalytics Engine", 85, 20),
    ]

    for num, name, x, y in subsystems:
        box = patches.FancyBboxPatch((x-11, y-8), 22, 16, boxstyle="round,pad=0.5,rounding_size=3",
                                     facecolor='#EFF6FF', edgecolor='#2563EB', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y+3, num, weight='bold', fontsize=10, ha='center', va='center', color='#1E3A8A')
        ax.text(x, y-3, name, fontsize=8, ha='center', va='center', color='#1F2937')

    # Draw Central Data Stores (D1 to D10)
    stores = [
        ("D1: Users", 32, 92),
        ("D2: Events", 68, 92),
        ("D3: Venues", 100, 70),
        ("D4: Bookings", 100, 40),
        ("D5: Bookmarks", 2, 52),
        ("D6: Registrations", 40, 36),
        ("D7: Tickets & Att.", 60, 36),
        ("D8: Notifications", 2, 20),
        ("D9: Timetable", 40, 6),
        ("D10: Audit Logs", 98, 6),
    ]

    for label, sx, sy in stores:
        # Open ended rectangle for DFD data store
        ax.plot([sx-6, sx+6], [sy+3, sy+3], color='#047857', lw=1.5)
        ax.plot([sx-6, sx+6], [sy-3, sy-3], color='#047857', lw=1.5)
        ax.plot([sx-6, sx-6], [sy-3, sy+3], color='#047857', lw=1.5)
        ax.text(sx, sy, label, fontsize=7.5, weight='bold', ha='center', va='center', color='#065F46')

    # Draw interconnecting flow lines
    # 2.0 to 4.0
    ax.annotate("", xy=(85, 60), xytext=(61, 82), arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.2))
    ax.text(76, 74, "Validate Slot", fontsize=7, color='#B91C1C', rotation=-30)

    # 3.0 to 4.0
    ax.annotate("", xy=(85, 60), xytext=(85, 74), arrowprops=dict(arrowstyle="->", color='#059669', lw=1.2))

    # 4.0 to 9.0
    ax.annotate("", xy=(85, 28), xytext=(85, 44), arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.2))
    ax.text(88, 36, "Clash Diagnostics", fontsize=7, color='#B91C1C')

    # 6.0 to 7.0
    ax.annotate("", xy=(26, 23), xytext=(45, 47), arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.2))
    ax.text(32, 33, "Trigger Alert", fontsize=7, color='#1E40AF', rotation=30)

    # 6.0 to 8.0
    ax.annotate("", xy=(50, 28), xytext=(50, 44), arrowprops=dict(arrowstyle="->", color='#7C3AED', lw=1.2))
    ax.text(52, 36, "Check Clash", fontsize=7, color='#6D28D9')

    # 1.0 to 5.0
    ax.annotate("", xy=(15, 60), xytext=(15, 74), arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.2))
    ax.text(17, 67, "Student Interests", fontsize=7, color='#1E40AF')

    plt.title("Level 1: Eventra Subsystem Data Flow Diagram (9 Modules & Data Stores)", fontsize=13, weight='bold', pad=15, color='#1E3A8A')
    plt.tight_layout()
    plt.savefig('diagrams_temp/dfd_level1.png', dpi=200, bbox_inches='tight')
    plt.close()
    print("Level 1 DFD generated.")

def generate_dfd_level2_reg():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Processes in Module 6
    steps = [
        ("6.1", "Personal Clash Check\n(Module 8 Integration)", 15, 80),
        ("6.2", "Capacity Evaluator\n(Seats Available?)", 45, 80),
        ("6.3", "Seat Allocator &\nQR Ticket Generator", 80, 80),
        ("6.4", "FIFO Waitlist\nEnqueuer (Position #N)", 45, 45),
        ("6.5", "Cancellation &\nAuto-Promotion Engine", 45, 15),
        ("6.6", "Gate QR Scanner &\nDuplicate Checker", 80, 45)
    ]

    for num, title, x, y in steps:
        box = patches.FancyBboxPatch((x-12, y-8), 24, 16, boxstyle="round,pad=0.5,rounding_size=3",
                                     facecolor='#FEF3C7' if 'Waitlist' in title else '#EFF6FF',
                                     edgecolor='#D97706' if 'Waitlist' in title else '#2563EB', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y+3, num, weight='bold', fontsize=9.5, ha='center', va='center', color='#1E3A8A')
        ax.text(x, y-3, title, fontsize=8, ha='center', va='center', color='#1F2937')

    # Data Store Rectangles
    def draw_ds(x, y, label):
        ax.plot([x-8, x+8], [y+2.5, y+2.5], color='#047857', lw=1.5)
        ax.plot([x-8, x+8], [y-2.5, y-2.5], color='#047857', lw=1.5)
        ax.plot([x-8, x-8], [y-2.5, y+2.5], color='#047857', lw=1.5)
        ax.text(x, y, label, fontsize=7.5, weight='bold', ha='center', va='center', color='#065F46')

    draw_ds(15, 45, "D9: Timetable")
    draw_ds(80, 15, "D7: Tickets & Attendance")
    draw_ds(15, 15, "D6: Registrations")

    # Connectors
    # 6.1 -> 6.2
    ax.annotate("", xy=(33, 80), xytext=(27, 80), arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.5))
    ax.text(30, 82, "Passed", fontsize=7.5, color='#1E40AF', ha='center')

    # 6.2 -> 6.3 (Confirmed)
    ax.annotate("", xy=(68, 80), xytext=(57, 80), arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(62, 82, "Seats Open", fontsize=7.5, color='#047857', ha='center')

    # 6.2 -> 6.4 (Full)
    ax.annotate("", xy=(45, 53), xytext=(45, 72), arrowprops=dict(arrowstyle="->", color='#D97706', lw=1.5))
    ax.text(49, 63, "Full Capacity", fontsize=7.5, color='#B45309')

    # 6.5 -> 6.3 (Auto Promotion)
    ax.annotate("", xy=(72, 74), xytext=(55, 23), arrowprops=dict(arrowstyle="->", color='#7C3AED', lw=1.5, ls='--'))
    ax.text(68, 45, "Auto-Promote\nNext Waitlist", fontsize=7.5, color='#6D28D9')

    # 6.6 Scanner flow
    ax.annotate("", xy=(80, 20), xytext=(80, 37), arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(82, 28, "Log Gate Scan", fontsize=7.5, color='#047857')

    plt.title("Level 2 DFD: Module 6 - Registration, FIFO Waitlist & Gate Check-in", fontsize=12, weight='bold', pad=15, color='#1E3A8A')
    plt.tight_layout()
    plt.savefig('diagrams_temp/dfd_level2_reg.png', dpi=200, bbox_inches='tight')
    plt.close()
    print("Level 2 Registration DFD generated.")

def generate_dfd_level2_clash():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    steps = [
        ("4.1", "Interval Overlap\nComparator (start < end)", 20, 80),
        ("4.2", "Multi-Category Conflict\nEvaluator (5 Clash Types)", 65, 80),
        ("4.3", "Severity & Remedial\nBuilder (Critical/High/Med)", 65, 45),
        ("4.4", "Alternative Suggestion\nEngine (Slots/Venues/Dates)", 20, 45),
        ("4.5", "Admin Override &\nAudit Logger", 65, 15)
    ]

    for num, title, x, y in steps:
        box = patches.FancyBboxPatch((x-14, y-8), 28, 16, boxstyle="round,pad=0.5,rounding_size=3",
                                     facecolor='#FEE2E2' if 'Evaluator' in title or 'Severity' in title else '#EFF6FF',
                                     edgecolor='#DC2626' if 'Evaluator' in title or 'Severity' in title else '#2563EB', linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y+3, num, weight='bold', fontsize=9.5, ha='center', va='center', color='#1E3A8A')
        ax.text(x, y-3, title, fontsize=8, ha='center', va='center', color='#1F2937')

    # Data Stores
    def draw_ds(x, y, label):
        ax.plot([x-8, x+8], [y+2.5, y+2.5], color='#047857', lw=1.5)
        ax.plot([x-8, x+8], [y-2.5, y-2.5], color='#047857', lw=1.5)
        ax.plot([x-8, x-8], [y-2.5, y+2.5], color='#047857', lw=1.5)
        ax.text(x, y, label, fontsize=7.5, weight='bold', ha='center', va='center', color='#065F46')

    draw_ds(20, 15, "D4: Bookings & Blackouts")
    draw_ds(20, 95, "D2: Events Store")

    # Connectors
    ax.annotate("", xy=(51, 80), xytext=(34, 80), arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.5))
    ax.text(42, 82, "Time Overlap", fontsize=7.5, color='#1E40AF', ha='center')

    ax.annotate("", xy=(65, 53), xytext=(65, 72), arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.5))
    ax.text(67, 63, "Clash Detected", fontsize=7.5, color='#B91C1C')

    ax.annotate("", xy=(34, 45), xytext=(51, 45), arrowprops=dict(arrowstyle="->", color='#2563EB', lw=1.5))
    ax.text(42, 47, "Compute Options", fontsize=7.5, color='#1E40AF', ha='center')

    ax.annotate("", xy=(65, 23), xytext=(65, 37), arrowprops=dict(arrowstyle="->", color='#7C3AED', lw=1.5))
    ax.text(67, 30, "Override with Reason", fontsize=7.5, color='#6D28D9')

    plt.title("Level 2 DFD: Module 4 - Multi-Dimensional Clash Validation Engine", fontsize=12, weight='bold', pad=15, color='#1E3A8A')
    plt.tight_layout()
    plt.savefig('diagrams_temp/dfd_level2_clash.png', dpi=200, bbox_inches='tight')
    plt.close()
    print("Level 2 Clash DFD generated.")

def generate_erd():
    fig, ax = plt.subplots(figsize=(11, 8), dpi=200)
    ax.set_xlim(0, 110)
    ax.set_ylim(0, 100)
    ax.axis('off')

    entities = [
        ("USER", 15, 82, ["id (PK)", "name", "email", "role", "branch", "isVerified"]),
        ("EVENT", 55, 82, ["id (PK)", "title", "venue", "date", "capacity", "organiserId (FK)"]),
        ("VENUE", 92, 82, ["id (PK)", "name", "capacity", "availableFrom", "availableTo", "isActive"]),
        ("BOOKING", 92, 45, ["id (PK)", "venueId (FK)", "eventId (FK)", "date", "startTime", "endTime"]),
        ("REGISTRATION", 55, 45, ["id (PK)", "eventId (FK)", "userId (FK)", "ticketCode", "status"]),
        ("TICKET", 55, 12, ["id (PK)", "ticketCode (UK)", "qrCode", "status", "issuedAt"]),
        ("ATTENDANCE", 92, 12, ["id (PK)", "eventId (FK)", "ticketCode (FK)", "checkInTime"]),
        ("TIMETABLE_SLOT", 15, 45, ["id (PK)", "userId (FK)", "subject", "dayOfWeek", "startTime"]),
        ("NOTIFICATION", 15, 12, ["id (PK)", "userId (FK)", "title", "type", "isRead"])
    ]

    for title, x, y, attrs in entities:
        w, h = 22, 22
        box = patches.FancyBboxPatch((x-w/2, y-h/2), w, h, boxstyle="round,pad=0.3,rounding_size=2",
                                     facecolor='#F8FAFC', edgecolor='#1E3A8A', linewidth=1.5)
        ax.add_patch(box)
        # Header bar
        hbar = patches.FancyBboxPatch((x-w/2, y+h/2-5), w, 5, boxstyle="round,pad=0.2,rounding_size=1",
                                      facecolor='#1E3A8A', edgecolor='#1E3A8A')
        ax.add_patch(hbar)
        ax.text(x, y+h/2-2.5, title, weight='bold', fontsize=9, ha='center', va='center', color='white')

        # Attributes list
        start_y = y+h/2-7.5
        for i, attr in enumerate(attrs):
            ax.text(x-w/2+1.5, start_y - (i*2.8), "• " + attr, fontsize=7, color='#1F2937', va='center')

    # Relationships Lines
    def draw_rel(x1, y1, x2, y2, label):
        ax.plot([x1, x2], [y1, y2], color='#2563EB', lw=1.2)
        mid_x, mid_y = (x1+x2)/2, (y1+y2)/2
        ax.text(mid_x, mid_y + 2, label, fontsize=7, weight='bold', color='#1E40AF', ha='center',
                bbox=dict(boxstyle="round,pad=0.2", facecolor='white', edgecolor='#93C5FD', lw=0.5))

    draw_rel(26, 82, 44, 82, "1 : N (creates)")
    draw_rel(66, 82, 81, 82, "N : 1 (booked in)")
    draw_rel(92, 71, 92, 56, "1 : N (hosts)")
    draw_rel(55, 71, 55, 56, "1 : N (registers)")
    draw_rel(55, 34, 55, 23, "1 : 1 (issues)")
    draw_rel(66, 12, 81, 12, "1 : 1 (scanned)")
    draw_rel(15, 71, 15, 56, "1 : N (schedules)")
    draw_rel(15, 34, 15, 23, "1 : N (receives)")

    plt.title("Entity-Relationship (ER) Domain Model: Core Campus Database Schema", fontsize=12, weight='bold', pad=15, color='#1E3A8A')
    plt.tight_layout()
    plt.savefig('diagrams_temp/erd_diagram.png', dpi=200, bbox_inches='tight')
    plt.close()
    print("ERD generated.")

if __name__ == '__main__':
    generate_dfd_level0()
    generate_dfd_level1()
    generate_dfd_level2_reg()
    generate_dfd_level2_clash()
    generate_erd()
