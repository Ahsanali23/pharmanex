using Microsoft.EntityFrameworkCore;
using Pharmacy_pos.Models;
using Pharmacy_pos.Data;
using System.Security.Claims; // Added for ClaimsPrincipal
namespace Pharmacy_pos.Helper
{
    internal static class HelperFunction
    {       
        // Added ClaimsPrincipal parameter to access user claims
        public static async Task<bool> HasPermissionAsync(ApplicationDbContext context, ClaimsPrincipal user, string permissionName)
        {
            var userIdClaim = user.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return false;
            if (!int.TryParse(userIdClaim, out int userId)) return false;

            var userEntity = await context.User.Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (userEntity == null) return false;

            var hasPermission = await context.RolePermission
                .Include(rp => rp.Permission)
                .AnyAsync(rp => rp.RoleId == userEntity.RoleId && rp.Permission.Name == permissionName);

            return hasPermission;
        }
    }
}
