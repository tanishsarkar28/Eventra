/**
 * Module 5 Recommendation & Relevance Scoring Engine
 * 
 * Inputs for calculating the "Relevant to me" score (0 to 100):
 * 1. User Interests matching Event Tags & Category (up to 40 pts)
 * 2. Academic alignment: Branch / Year relevance (up to 25 pts)
 * 3. Proximity: Events happening soonest receive higher temporal boost (up to 20 pts)
 * 4. Popularity: Capacity & Bookmarks count (up to 15 pts)
 */

export function calculateRelevanceScore(event, user = null, bookmarkCount = 0) {
  let score = 0;

  // If no user is logged in, score is based purely on popularity and proximity
  const userInterests = (user && Array.isArray(user.interests))
    ? user.interests.map(i => i.trim().toLowerCase())
    : [];

  const eventTags = Array.isArray(event.tags)
    ? event.tags.map(t => t.trim().toLowerCase())
    : [];

  const eventCategory = (event.category || '').toLowerCase();
  const eventTitle = (event.title || '').toLowerCase();
  const eventDesc = (event.description || '').toLowerCase();

  // 1. Interest Matching (Max 40 points)
  if (userInterests.length > 0) {
    let matchedInterestsCount = 0;

    userInterests.forEach(interest => {
      // Check in tags
      const inTags = eventTags.some(t => t.includes(interest) || interest.includes(t));
      // Check in category
      const inCategory = eventCategory.includes(interest) || interest.includes(eventCategory);
      // Check in title or desc
      const inText = eventTitle.includes(interest) || eventDesc.includes(interest);

      if (inTags || inCategory || inText) {
        matchedInterestsCount++;
      }
    });

    const interestRatio = Math.min(matchedInterestsCount / Math.max(userInterests.length, 1), 1);
    score += Math.round(interestRatio * 40);
  } else {
    // Default baseline interest score if user has no interests specified
    score += 15;
  }

  // 2. Academic / Branch Alignment (Max 25 points)
  if (user && (user.branch || user.year)) {
    const userBranch = (user.branch || '').toLowerCase();
    const userYear = (user.year || '').toLowerCase();

    // Check if event targets student branch
    if (userBranch && (eventTitle.includes(userBranch) || eventDesc.includes(userBranch) || eventTags.some(t => t.includes(userBranch)))) {
      score += 15;
    } else {
      score += 8; // general campus events still relevant
    }

    // Check if event mentions user year (e.g. 1st year, 3rd year)
    if (userYear && (eventTitle.includes(userYear) || eventDesc.includes(userYear))) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    score += 10;
  }

  // 3. Time Proximity (Max 20 points)
  if (event.date) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.date);
      const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 3) {
        score += 20; // Happening in next 3 days
      } else if (diffDays > 3 && diffDays <= 7) {
        score += 15; // Happening this week
      } else if (diffDays > 7 && diffDays <= 14) {
        score += 10; // Happening in next two weeks
      } else if (diffDays > 14) {
        score += 5;
      }
    } catch (e) {
      score += 5;
    }
  }

  // 4. Popularity & Engagement (Max 15 points)
  const bookmarksBoost = Math.min((bookmarkCount || 0) * 3, 10);
  const capacityBoost = (Number(event.capacity) >= 100) ? 5 : 2;
  score += (bookmarksBoost + capacityBoost);

  // Normalize final score between 0 and 100
  return Math.min(Math.max(score, 10), 100);
}
