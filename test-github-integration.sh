#!/bin/bash
# Test script for GitHub repository import on deployment page

echo "======================================"
echo "GitHub Integration Testing Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if servers are running
echo -e "${YELLOW}Test 1: Checking if servers are running...${NC}"
echo ""

if curl -s http://localhost:5000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Backend server running on port 5000${NC}"
else
  echo -e "${RED}✗ Backend server NOT running on port 5000${NC}"
  echo "Start with: cd server && npm run dev"
  exit 1
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend server running on port 3000${NC}"
else
  echo -e "${RED}✗ Frontend server NOT running on port 3000${NC}"
  echo "Start with: npm run dev"
  exit 1
fi

echo ""
echo -e "${YELLOW}Test 2: Manual testing steps${NC}"
echo ""
echo "Follow these steps to test the fix:"
echo ""
echo "1. Open http://localhost:3000 in browser"
echo ""
echo "2. Login to your account"
echo ""
echo "3. Go to Deployments page"
echo "   - Click 'New Deployment' button"
echo ""
echo "4. Select 'GitHub' tab"
echo ""
echo "5. Click 'Connect GitHub' button"
echo "   - You'll be redirected to GitHub authorization"
echo ""
echo "6. Click 'Authorize' on GitHub"
echo "   - GitHub redirects you back to http://localhost:3000/deployments"
echo ""
echo "7. Check browser console (F12) for logs:"
echo "   - 'API Client: Checking GitHub connection status...'"
echo "   - 'API Client: Connection status: { connected: true, ... }'"
echo "   - 'API Client: Fetching GitHub repositories...'"
echo "   - 'API Client: Got repositories count: X'"
echo ""
echo "8. Check backend terminal (server/) for logs:"
echo "   - '=== FETCH REPOSITORIES ==='"
echo "   - 'User ID: [user_id]'"
echo "   - 'GitHub integration found: true'"
echo "   - 'GitHub username: your-username'"
echo "   - 'GitHub API response - repos count: X'"
echo ""
echo "9. Verify repositories appear in the dialog"
echo "   - You should see list of your GitHub repositories"
echo "   - You can search/filter repositories"
echo "   - You can select one and see branches"
echo ""
echo "10. Try deploying a repository"
echo ""
echo -e "${GREEN}=== All systems ready for testing! ===${NC}"
echo ""
