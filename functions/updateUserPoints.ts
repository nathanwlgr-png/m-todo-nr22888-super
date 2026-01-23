import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, value } = await req.json();

    // Get or create user points
    const pointsRecords = await base44.entities.SalesPoints.filter({ user_email: user.email });
    let userPoints = pointsRecords[0];

    if (!userPoints) {
      userPoints = await base44.entities.SalesPoints.create({
        user_email: user.email,
        user_name: user.full_name,
        total_points: 0,
        month_points: 0,
        tasks_completed: 0,
        sales_closed: 0,
        visits_completed: 0,
        level: 1,
        badges: [],
        streak_days: 0
      });
    }

    // Points mapping
    const pointsMap = {
      task_completed: 10,
      visit_completed: 25,
      sale_closed: 100,
      hot_client: 50,
      proposal_sent: 30,
      goal_achieved: value || 100
    };

    const pointsToAdd = pointsMap[action] || 0;

    // Update points
    const updates = {
      total_points: userPoints.total_points + pointsToAdd,
      month_points: userPoints.month_points + pointsToAdd
    };

    if (action === 'task_completed') {
      updates.tasks_completed = (userPoints.tasks_completed || 0) + 1;
    } else if (action === 'visit_completed') {
      updates.visits_completed = (userPoints.visits_completed || 0) + 1;
    } else if (action === 'sale_closed') {
      updates.sales_closed = (userPoints.sales_closed || 0) + 1;
    }

    // Update level
    updates.level = Math.floor(updates.total_points / 1000) + 1;

    await base44.entities.SalesPoints.update(userPoints.id, updates);

    return Response.json({ 
      success: true, 
      points_added: pointsToAdd,
      new_total: updates.total_points,
      new_level: updates.level
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});