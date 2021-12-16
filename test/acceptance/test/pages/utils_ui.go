package pages

import (
	"fmt"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sclevine/agouti"
)

func GetWindowName(webDriver *agouti.Page) string {
	var result string
	Expect(webDriver.RunScript(`return window.name`, map[string]interface{}{}, &result)).ShouldNot(HaveOccurred())
	return result
}

func SetWindowName(webDriver *agouti.Page, windowName string) {
	var result interface{}
	Expect(webDriver.RunScript(fmt.Sprintf(`window.name="%s"`, windowName), map[string]interface{}{}, &result)).ShouldNot(HaveOccurred())
}

func ElementExist(element *agouti.Selection) bool {
	for range [5]int{} {
		if count, _ := element.Count(); count == 1 {
			return true
		}
		time.Sleep(1 * time.Second)
	}
	return false
}

func ScrollWindow(webDriver *agouti.Page, xOffSet int, yOffSet int) {
	// script := fmt.Sprintf(`var elmnt = document.evaluate('%s', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; elmnt.scrollIntoView();`, xpath)

	script := fmt.Sprintf(`window.scrollTo(%d, %d)`, xOffSet, yOffSet)
	var result interface{}
	Expect(webDriver.RunScript(script, map[string]interface{}{}, &result)).ShouldNot(HaveOccurred())
}