using System.Web.Mvc;

namespace ChatJsMvcSample.Controllers
{
    public class CheckoutController : Controller
    {
        public string Cancelled()
        {
            return "You cancelled";
        }

        public string Thanks()
        {
            return "Thanks!";
        }
    }
}
