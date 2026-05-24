import { Elysia, t } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/', () => ({
    success: true,
    data: "Welcome to the Ads Machine Learning Dashboard API",
    error: null
  }))
  .get('/health', () => ({
    success: true,
    data: "Healthy",
    error: null
  }))
  
  // Intelligence Feature
  .group('/intelligence', (app) => app
    .get('/readiness-score', () => ({
      success: true,
      data: {
        score: 84,
        narrative: "Your 'Aman Gak?' score is high. Customer trust is peaking due to fast response times, but ad budget for 'Kain Batik' is under-allocated.",
        recommendations: [
          "Increase budget for 'Kain Batik' by 15%",
          "Highlight 'Fast Shipping' in your next ad copy",
          "Respond to 3 pending marketplace reviews"
        ]
      },
      error: null
    }))
    .get('/sentiment-trends', () => ({
      success: true,
      data: [
        { month: 'Jan', positive: 65, negative: 10 },
        { month: 'Feb', positive: 70, negative: 8 },
        { month: 'Mar', positive: 82, negative: 5 }
      ],
      error: null
    }))
  )

  // Meta Ads Feature
  .group('/meta-ads', (app) => app
    .get('/ads', () => ({
      success: true,
      data: [
        { id: '1', name: 'Promo Ramadhan - Batik', status: 'ACTIVE', spend: 500000, roas: 3.2 },
        { id: '2', name: 'New Arrival - Gamis', status: 'PAUSED', spend: 200000, roas: 2.1 }
      ],
      error: null
    }))
    .post('/update-budget', ({ body }) => ({
      success: true,
      data: "Budget updated successfully",
      error: null
    }))
  );


export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
